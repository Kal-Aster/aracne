const getBuildCommand = require("../utils/getBuildCommand");
const getChanged = require("../utils/getChanged");
const getPackedPackagesPath = require("../utils/getPackedPackagesPath");
const getPackFilename = require("../utils/getPackFilename");
const replaceDependencyOrigin = require("../utils/replaceDependencyOrigin");

const installedCheck = require("installed-check-core");

const { execSync } = require("child_process");
const {
    existsSync, lstatSync, mkdirSync,
    readFileSync, writeFileSync
} = require("fs");
const { join, resolve } = require("path");

const packedPackagesPath = getPackedPackagesPath();

if (!existsSync(packedPackagesPath)) {
    mkdirSync(packedPackagesPath);
}
const relativePackedPackagesPath = getPackedPackagesPath(true);
const changed = getChanged({
    filtered: false,
    includeDevDeps: true
});

(async () => {
    for (let i = 0; i < changed.length; i++) {
        const package = changed[i];

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
            continue;
        }
        
        const { errors } = (package.changed ?
            Object.create(null) :
            await installedCheck({
                engineCheck: false,
                versionCheck: true,
                engineNoDev: false,
                path: package.path
            })
        );
        if (!errors || errors.length > 0) {
            console.log("Installing dependencies");
            try {
                const commands = [
                    `cd "${package.path}"`
                ];
                if (localDependencies.length > 0) {
                    if (package.localDependencies.length > 0) {
                        commands.push(`npm i ${
                            package.localDependencies.map(({ packFilename }) => {
                                return join(relativePackedPackagesPath, packFilename);
                            }).join(" ")
                        }`);
                    }
                    if (package.localPeerDependencies.length > 0) {
                        commands.push(`npm i --save-peer ${
                            package.localPeerDependencies.map(({ packFilename }) => {
                                return join(relativePackedPackagesPath, packFilename);
                            }).join(" ")
                        }`);
                    }
                    if (package.localDevDependencies.length > 0) {
                        commands.push(`npm i -D ${
                            package.localDevDependencies.map(({ packFilename }) => {
                                return join(relativePackedPackagesPath, packFilename);
                            }).join(" ")
                        }`);
                    }
                } else {
                    commands.push(`npm i`);
                }

                execSync(
                    commands.join(" && "),
                    { stdio: "inherit", encoding: "utf-8" }
                );
            } catch (error) {
                console.groupEnd();
                throw error;
            }
        } else {
            console.log("Dependencies installed");
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
                    `file:${resolve(join(packedPackagesPath, dependency.packFilename))}`
                );
            });
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
    }
})();