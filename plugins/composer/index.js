const { execSync } = require("child_process");
const { existsSync, readFileSync, rmSync, writeFileSync, lstatSync } = require("fs");
const { join } = require("path");

module.exports = {
    name: "composer",
    async getPackage(folder) {
        if (!(await this.isValid(folder))) {
            return null;
        }

        const {
            name,
            require: parsedDeps,
            "require-dev": parsedDevDeps,
            version
        } = JSON.parse(readFileSync(
            join(folder, "composer.json"),
            { encoding: "utf-8" }
        ));

        const dependencies = parsedDeps ? Object.keys(parsedDeps) : [];
        const devDependencies = parsedDevDeps ? Object.keys(parsedDevDeps) : [];

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
                return [];
            },
            get packFilename() {
                return null;
            }
        };

        return package;
    },
    async getLocalDependencies(package, packages) {
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
                value: [],
                writable: false,
                configurable: true
            }
        });

        return package;
    },
    async isPackedAndUpToDate(package) {
        return false;
    },
    async isValid(folder) {
        return existsSync(join(folder, "composer.json"));
    },
    async install(package) {
        const installed = JSON.parse(execSync(
            `cd "${package.folder}" && composer show -D -f json`,
            { stdio: "pipe", encoding: "utf-8" }
        )).installed.map(({ name }) => name);

        if (package.dependencies.concat(
                package.devDependencies
            ).every(dep => {
                return installed.includes(dep)
            })
        ) {
            console.log("Dependencies installed");
            return;
        }

        console.log("Installing dependencies");
        const commands = [
            `cd "${package.folder}"`,
            `composer i`
        ];

        execSync(
            commands.join(" && "),
            { stdio: "inherit", encoding: "utf-8" }
        );
    },
    async pack(package) { },
    async restoreLocalDependencies(package) {
        // const localDependencies = package.localDependencies.concat(
        //     package.localPeerDependencies
        // ).concat(
        //     package.localDevDependencies
        // );
        // if (localDependencies.length === 0) {
        //     return;
        // }
    
        // const packageJSONPath = join(package.folder, "package.json");
        // let packageJSON = readFileSync(
        //     packageJSONPath, { encoding: "utf-8" }
        // );
        // localDependencies.forEach(dependency => {
        //     packageJSON = replaceDependencyOrigin(
        //         packageJSON,
        //         dependency.name,
        //         dependency.version
        //     );
        // });
        // writeFileSync(packageJSONPath, packageJSON);
    },
    async setupLocalDependencies(package) {
        // const relativePackedPackagesPath = getPackedPackagesPath(true);

        // const localDependencies = package.localDependencies.concat(
        //     package.localPeerDependencies
        // ).concat(
        //     package.localDevDependencies
        // );
        // if (localDependencies.length > 0) {
        //     const packageJSONPath = join(package.folder, "package.json");
        //     let packageJSON = readFileSync(
        //         packageJSONPath, { encoding: "utf-8" }
        //     );
        //     localDependencies.forEach(dependency => {
        //         packageJSON = replaceDependencyOrigin(
        //             packageJSON,
        //             dependency.name,
        //             `file:${join(
        //                 relativePackedPackagesPath, dependency.packFilename
        //             )}`
        //         );
        //     });
        //     writeFileSync(packageJSONPath, packageJSON);
        // }
    },
    async setVersion(package, version) {
        if (package.version === version) {
            return;
        }
    
        const composerJSONPath = join(
            package.folder, "composer.json"
        );
        let composerJSONContent = readFileSync(
            composerJSONPath, { encoding: "utf-8" }
        );
    
        let bracketCount = 0;
        let versionUpdated = false;
        for (let i = 0; i < composerJSONContent.length; i++) {
            const char = composerJSONContent[i];
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
            const match = composerJSONContent.substr(
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
    
            composerJSONContent = (
                composerJSONContent.substr(0, startIndex) +
                version +
                composerJSONContent.substr(endIndex)
            );
            versionUpdated = true;
            break;
        }
    
        if (!versionUpdated) {
            throw new Error("Couldn't update version");
        }
    
        writeFileSync(composerJSONPath, composerJSONContent);
    }
};