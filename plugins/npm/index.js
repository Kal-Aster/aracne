const replaceDependencyOrigin = require("./replaceDependencyOrigin");
const getPackedPackagesPath = require("../../utils/getPackedPackagesPath");
const getPackFilename = require("./getPackFilename");

const installedCheck = require("installed-check-core");

const { execSync } = require("child_process");
const { existsSync, readFileSync, rmSync, writeFileSync, lstatSync, mkdirSync } = require("fs");
const { join } = require("path");

module.exports = {
    name: "npm",
    async getPackage(folder) {
        if (!(await this.isValid(folder))) {
            return null;
        }

        const {
            name,
            dependencies: parsedDeps,
            devDependencies: parsedDevDeps,
            peerDependencies: parsedPeerDeps,
            version
        } = JSON.parse(readFileSync(
            join(folder, "package.json"),
            { encoding: "utf-8" }
        ));

        const dependencies = parsedDeps ? Object.keys(parsedDeps) : [];
        const devDependencies = parsedDevDeps ? Object.keys(parsedDevDeps) : [];
        const peerDependencies = parsedPeerDeps ? Object.keys(parsedPeerDeps) : [];

        const manager = this;
        let v = version;
        
        const package = {
            get manager() { 
                return manager;
            },
            get folder() {
                return folder;
            },
            get name() {
                return name;
            },
            get version() {
                return v;
            },
            set version(version) {
                manager.setVersion(this, version);
                v = version;
            },
            get dependencies() {
                return [ ...dependencies ];
            },
            get devDependencies() {
                return [ ...devDependencies ];
            },
            get peerDependencies() {
                return [ ...peerDependencies ];
            },
            get packFilename() {
                return getPackFilename(name, version);
            }
        };

        return package;
    },
    async initLocalDependencies(package, packages) {
        Object.defineProperties(package, {
            localDependencies: {
                value: (
                    package.dependencies
                ).map(dependency => {
                    const index = packages.findIndex(
                        ({ name }) => name === dependency
                    );
                    if (index < 0) {
                        return null;
                    }
                    return packages[index];
                }).filter(package => package != null),
                writable: false,
                configurable: true
            },
            localDevDependencies: {
                value: (
                    package.devDependencies
                ).map(dependency => {
                    const index = packages.findIndex(
                        ({ name }) => name === dependency
                    );
                    if (index < 0) {
                        return null;
                    }
                    return packages[index];
                }).filter(package => package != null),
                writable: false,
                configurable: true
            },
            localPeerDependencies: {
                value: (
                    package.peerDependencies
                ).map(dependency => {
                    const index = packages.findIndex(
                        ({ name }) => name === dependency
                    );
                    if (index < 0) {
                        return null;
                    }
                    return packages[index];
                }).filter(package => package != null),
                writable: false,
                configurable: true
            }
        });

        return package;
    },
    async isPackedAndUpToDate(package) {
        const { packFilename } = package;
        const packPath = join(getPackedPackagesPath(), packFilename);
        const alreadyPacked = existsSync(packPath);

        const mostRecentDependencyPackMTime = (
            package.localDependencies.concat(
                package.localDevDependencies
            ).concat(
                package.localPeerDependencies
            ).reduce((mostRecentDependencyPackMTime, dep) => {
                return Math.max(
                    dep.packMTime,
                    dep.mostRecentDependencyPackMTime,
                    mostRecentDependencyPackMTime
                );
            }, 0)
        );
        const packMTime = alreadyPacked ? lstatSync(packPath).mtimeMs : 0;
        Object.defineProperties(package, {
            mostRecentDependencyPackMTime: {
                get() {
                    return mostRecentDependencyPackMTime;
                },
                configurable: true
            },
            packMTime: {
                get() { return packMTime; },
                configurable: true
            }
        });

        return alreadyPacked && (
            !package.changed ||
            (
                package.mostRecentChangedTime > 0 &&
                packMTime > package.mostRecentChangedTime &&
                packMTime > mostRecentDependencyPackMTime
            )
        );
    },
    async isValid(folder) {
        return existsSync(join(folder, "package.json"));
    },
    async install(package) {
        const relativePackedPackagesPath = getPackedPackagesPath(true);

        const { errors } = (package.changed ?
            Object.create(null) :
            await installedCheck({
                engineCheck: false,
                versionCheck: true,
                engineNoDev: false,
                path: package.folder
            })
        );
        if (errors && errors.length === 0) {
            console.log("Dependencies installed");
            return;
        }
        console.log("Installing dependencies");
        const commands = [
            `cd "${package.folder}"`
        ];
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
        if (commands.length > 1) {
            commands.push(`npm i`);
        }

        execSync(
            commands.join(" && "),
            { stdio: "inherit", encoding: "utf-8" }
        );
    },
    async pack(package) {
        const packedPackagesPath = getPackedPackagesPath();

        const packageJSONPath = join(package.folder, "package.json");
        const previousPackageJSONContent = readFileSync(
            packageJSONPath, { encoding: "utf-8" }
        );
        if (
            package.localDependencies.length > 0 ||
            package.localDevDependencies.length > 0 ||
            package.localPeerDependencies.length > 0
        ) {
            let packageJSON = previousPackageJSONContent;
            (
                package.localDependencies
            ).concat(
                package.localDevDependencies
            ).concat(
                package.localPeerDependencies
            ).forEach(dependency => {
                packageJSON = replaceDependencyOrigin(
                    packageJSON,
                    dependency.name,
                    `file:${resolve(join(
                        packedPackagesPath, dependency.packFilename
                    ))}`
                );
            });
            writeFileSync(packageJSONPath, packageJSON);
        }
        let error = null;
        try {
            const relativePackedPackagesPath = getPackedPackagesPath(true);
            const packedPackagesPath = join(package.folder, relativePackedPackagesPath);
            if (!existsSync(packedPackagesPath)) {
                mkdirSync(packedPackagesPath);
            }

            const packFilename = execSync(
                `cd "${package.folder}" && npm pack --pack-destination "${
                    relativePackedPackagesPath
                }"`,
                { stdio: "pipe", encoding: "utf-8" }
            ).toString().replace("\n", "");

            const packMTime = lstatSync(
                join(packedPackagesPath, packFilename)
            ).mtimeMs;
            Object.defineProperties(package, {
                packFilename: {
                    get() { return packFilename },
                    configurable: true
                },
                packMTime: {
                    get() { return packMTime; },
                    configurable: true
                }
            });

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
    },
    async restoreLocalDependencies(package) {
        const localDependencies = package.localDependencies.concat(
            package.localPeerDependencies
        ).concat(
            package.localDevDependencies
        );
        if (localDependencies.length === 0) {
            return;
        }
    
        const packageJSONPath = join(package.folder, "package.json");
        let packageJSON = readFileSync(
            packageJSONPath, { encoding: "utf-8" }
        );
        localDependencies.forEach(dependency => {
            packageJSON = replaceDependencyOrigin(
                packageJSON,
                dependency.name,
                dependency.version
            );
        });
        writeFileSync(packageJSONPath, packageJSON);
    },
    async setupLocalDependencies(package) {
        const relativePackedPackagesPath = getPackedPackagesPath(true);

        const localDependencies = package.localDependencies.concat(
            package.localPeerDependencies
        ).concat(
            package.localDevDependencies
        );
        if (localDependencies.length > 0) {
            const packageJSONPath = join(package.folder, "package.json");
            let packageJSON = readFileSync(
                packageJSONPath, { encoding: "utf-8" }
            );
            localDependencies.forEach(dependency => {
                packageJSON = replaceDependencyOrigin(
                    packageJSON,
                    dependency.name,
                    `file:${join(
                        relativePackedPackagesPath, dependency.packFilename
                    )}`
                );
            });
            writeFileSync(packageJSONPath, packageJSON);
        }
    },
    async setVersion(package, version) {
        if (package.version === version) {
            return;
        }
    
        const { packFilename } = package;
        const packedPackagesPath = getPackedPackagesPath();
        rmSync(join(
            packedPackagesPath,
            packFilename
        ), { force: true });
    
        const packageJSONPath = join(
            package.folder, "package.json"
        );
        let packageJSONContent = readFileSync(
            packageJSONPath, { encoding: "utf-8" }
        );
    
        let bracketCount = 0;
        let versionUpdated = false;
        for (let i = 0; i < packageJSONContent.length; i++) {
            const char = packageJSONContent[i];
            if (char === "{") {
                bracketCount++;
                continue;
            }
            if (char === "}") {
                bracketCount--;
                continue;
            }
            if (bracketCount !== 1) {
                continue;
            }
    
            if (char !== "v") {
                continue;
            }
            const match = packageJSONContent.substr(
                i - 1
            ).match(
                /^"version"\s*:\s*"(.*)"/
            );
            if (match == null) {
                continue;
            }
            const { index } = match[0].match(
                new RegExp(`(?<=^"version"\\s*:\\s*")${
                    match[1]
                }(?=")`)
            );
            const startIndex = i - 1 + match.index + index;
            const endIndex = startIndex + match[1].length;
    
            packageJSONContent = (
                packageJSONContent.substr(0, startIndex) +
                version +
                packageJSONContent.substr(endIndex)
            );
            versionUpdated = true;
            break;
        }
    
        if (!versionUpdated) {
            throw new Error("Couldn't update version");
        }
    
        writeFileSync(packageJSONPath, packageJSONContent);
    }
};