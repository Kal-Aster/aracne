const { execSync } = require("child_process");
const { existsSync, readFileSync, rmSync, writeFileSync, lstatSync } = require("fs");
const { join, relative } = require("path");

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
        const installed = (JSON.parse(execSync(
            `cd "${package.folder}" && composer show -D -f json`,
            { stdio: "pipe", encoding: "utf-8" }
        )).installed ?? []).map(({ name }) => name);

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
        execSync([
            `cd "${package.folder}"`,
            ...package.localDependencies.concat(
                package.localDevDependencies
            ).map(({ name }) => {
                return `composer config --unset repositories.${name}`
            })
        ].join(" && "), {
            stdio: "inherit", encoding: "utf-8"
        });
    },
    async setupLocalDependencies(package) {
        execSync([
            `cd "${package.folder}"`,
            ...package.localDependencies.concat(
                package.localDevDependencies
            ).map(({ name, folder }) => {
                return `composer config repositories.${name} "${JSON.stringify({
                    type: "path",
                    url: relative(package.folder, folder),
                    options: {
                        symlink: false
                    }
                }).replace(/"/g, "\\\"")}"`
            })
        ].join(" && "), {
            stdio: "inherit", encoding: "utf-8"
        });
    },
    async setVersion(package, version) {
        if (package.version === version) {
            return;
        }
    
        execSync([
            `cd "${package.folder}"`,
            `composer config version ${version}`
        ].join(" && "), {
            stdio: "inherit", encoding: "utf-8"
        });
    }
};