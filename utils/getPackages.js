const getPackagesPaths = require("./getPackagesPaths");
const getFolderConfig = require("./getFolderConfig");
const Languages = require("./Languages");

const { readdirSync } = require("fs");
const { join } = require("path");

const defaultOptions = {
    sorted: true,
    includeDevDeps: false
};

module.exports = async function getPackages({
    sorted,
    includeDevDeps
} = defaultOptions) {
    sorted = sorted ?? defaultOptions.sorted;
    includeDevDeps = includeDevDeps ?? defaultOptions.includeDevDeps;

    const packages = getPackagesPaths().reduce((folders, packagesPath) => {
        return folders.concat(readdirSync(packagesPath).map(path => {
            const folder = join(packagesPath, path).replace(/[\\\/]+/, "/");
            return {
                folder,
                config: getFolderConfig(folder)
            };
        }));
    }, [])
    
    for (let i = packages.length -1; i >= 0; i--) {
        const {
            folder,
            config
        } = packages[i];
        
        const package = await Languages.getManager(
            config.lang, config.manager
        ).getPackage(folder);
        
        if (package == null) {
            console.log(`Cannot get package in ${folder}`);
            packages.splice(i, 1);
            continue;
        }
        Object.defineProperties(package, {
            config: {
                get() { return config; },
                configurable: true
            }
        });
        packages[i] = package;
    }

    for (let i = 0; i < packages.length; i++) {
        const package = packages[i];

        const filteredPackages = packages.filter(({ config: { lang } }) => {
            return lang === package.config.lang;
        });
    
        packages[i] = await package.manager.initLocalDependencies(
            package, filteredPackages
        );
    }

    if (!sorted) {
        return packages;
    }

    return packages.reverse().reduce((result, package) => {
        return unshiftPackageAndLocalDependencies(package, result);
    }, []);

    function unshiftPackageAndLocalDependencies(package, list) {
        list.unshift(package);
        const localDependencies = package.localDependencies.concat(
            package.localPeerDependencies
        ).concat(
            includeDevDeps ? package.localDevDependencies : []
        );
        for (let i = localDependencies.length - 1; i >= 0; i--) {
            unshiftPackageAndLocalDependencies(
                localDependencies[i], list
            );
        }
        for (let index = list.length - 1; index >= 0; index--) {
            if (list.indexOf(list[index]) === index) {
                continue;
            }

            list.splice(index, 1);
        }
        return list;
    }
}