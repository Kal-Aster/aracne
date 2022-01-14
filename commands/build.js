const getBuildCommand = require("../utils/getBuildCommand");
const getChanged = require("../utils/getChanged");
const getPackedPackagesPath = require("../utils/getPackedPackagesPath");
const getPackFilename = require("../utils/getPackFilename");
const replaceDependencyOrigin = require("../utils/replaceDependencyOrigin");

const { execSync } = require("child_process");
const {
    existsSync, lstatSync, mkdirSync,
    readFileSync, writeFileSync
} = require("fs");
const { join } = require("path");

const packedPackagesPath = getPackedPackagesPath();

if (!existsSync(packedPackagesPath)) {
    mkdirSync(packedPackagesPath);
}
const relativePackedPackagesPath = getPackedPackagesPath(true);
getChanged({
    filtered: false,
    includeDevDeps: true
}).forEach(package => {
    console.group(`Package ${package.name}@${package.version}:`);
    const localDependencies = package.localDependencies.concat(
        package.localPeerDependencies
    ).concat(
        package.localDevDependencies
    );
    if (localDependencies.length > 0) {
        const packageJSONPath = join(package.path, "package.json");
        let packageJSON = readFileSync(
            packageJSONPath, { encoding: "utf-8" }
        );
        localDependencies.forEach(dependency => {
            packageJSON = replaceDependencyOrigin(
                packageJSON,
                dependency.name,
                `file:${join(relativePackedPackagesPath, dependency.packFilename)}`
            );
        });
        writeFileSync(packageJSONPath, packageJSON);
    }
    const packFilename = getPackFilename(package);
    const packPath = join(packedPackagesPath, packFilename);
    const alreadyPacked = existsSync(packPath);

    const mostRecentDependencyPackMTime = (
        localDependencies.reduce((mostRecentDependencyPackMTime, dep) => {
            return Math.max(
                dep.packMTime,
                dep.mostRecentDependencyPackMTime,
                mostRecentDependencyPackMTime
            );
        }, 0)
    );
    package.mostRecentDependencyPackMTime = mostRecentDependencyPackMTime;
    const packMTime = alreadyPacked ? lstatSync(packPath).mtimeMs : 0;
    package.packMTime = packMTime;

    const upToDate = alreadyPacked && (
        !package.changed ||
        (
            package.mostRecentChangedTime > 0 &&
            packMTime > package.mostRecentChangedTime &&
            packMTime > package.mostRecentDependencyPackMTime
        )
    );
    if (upToDate) {
        console.log(`Package already built and packed\n`);
        console.groupEnd();
        package.packFilename = packFilename
        return;
    }
    
    console.log("Installing dependencies");
    try {
        execSync(
            [
                `cd "${package.path}"`,
                ...(localDependencies.length > 0 ? 
                    [
                        `npm uninstall ${
                            localDependencies.map(({ name }) => name).join(" ")
                        }`,
                        ...(package.localDependencies.length > 0 ?
                            [`npm i ${
                                package.localDependencies.map(({ packFilename }) => {
                                    return join(relativePackedPackagesPath, packFilename);
                                }).join(" ")
                            }`] : []
                        ),
                        ...(package.localPeerDependencies.length > 0 ?
                            [`npm i --save-peer ${
                                package.localPeerDependencies.map(({ packFilename }) => {
                                    return join(relativePackedPackagesPath, packFilename);
                                }).join(" ")
                            }`] : []
                        ),
                        ...(package.localDevDependencies.length > 0 ?
                            [`npm i -D ${
                                package.localDevDependencies.map(({ packFilename }) => {
                                    return join(relativePackedPackagesPath, packFilename);
                                }).join(" ")
                            }`] : []
                        )
                    ] : [
                        `npm i`
                    ]
                )
            ].join(" && "),
            { stdio: "inherit", encoding: "utf-8" }
        );
    } catch (error) {
        console.groupEnd();
        throw error;
    }

    const buildCommand = getBuildCommand(package);
    if (buildCommand) {
        console.log(`Building`);
        try {
            execSync(
                `cd "${package.path}" && ${buildCommand}`,
                { stdio: "inherit", encoding: "utf-8" }
            );
        } catch (error) {
            console.groupEnd();
            throw error;
        }
    } else {
        console.log("Skipping build");
    }
    console.log(`Packing`);

    const packageJSONPath = join(package.path, "package.json");
    const previousPackageJSONContent = readFileSync(
        packageJSONPath, { encoding: "utf-8" }
    );
    if (localDependencies.length > 0) {
        let packageJSON = previousPackageJSONContent;
        localDependencies.forEach(dependency => {
            packageJSON = replaceDependencyOrigin(
                packageJSON,
                dependency.name,
                `file:./${dependency.packFilename}`
                );
            }
        );
        writeFileSync(packageJSONPath, packageJSON);
    }
    let error = null;
    try {
        const packFilename = execSync(
            `cd "${package.path}" && npm pack --pack-destination "${
                relativePackedPackagesPath
            }"`,
            { stdio: "pipe", encoding: "utf-8" }
        ).toString().replace("\n", "");
        package.packFilename = packFilename;

        package.packMTime = lstatSync(packPath).mtimeMs;

        console.log("");
    } catch (_error) {
        error = _error;
    } finally {
        console.groupEnd();
        writeFileSync(packageJSONPath, previousPackageJSONContent);
        if (error != null) {
            throw error;
        }
    }
});