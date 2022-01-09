const {
    existsSync,
    readdirSync,
    readFileSync
} = require("fs");
const {
    join,
    sep: pathSeparator
} = require("path");

const defaultOptions = {
    sorted: true,
    includeDevDeps: false
};

module.exports = function getPackages({
    sorted,
    includeDevDeps
} = defaultOptions) {
    sorted = sorted ?? defaultOptions.sorted;
    includeDevDeps = includeDevDeps ?? defaultOptions.includeDevDeps;

    const packages = readdirSync("packages").filter(path => {
        return existsSync(join("packages", path, "package.json"));
    }).map(packageDir => {
        const path = join("packages", packageDir);
        const {
            name,
            dependencies,
            devDependencies,
            version
        } = JSON.parse(readFileSync(
            join(path, "package.json"),
            { encoding: "utf-8" }
        ));

        return {
            path, name,
            version,
            dependencies: (
                dependencies ? Object.keys(dependencies) : []
            ),
            devDependencies: (
                devDependencies ? Object.keys(devDependencies) : []
            )
        };
    }).map((package, _, packages) => {
        const localDependencies = (
            package.dependencies
        ).map(dependency => {
            const index = packages.findIndex(package => package.name === dependency);
            if (index < 0) {
                return null;
            }
            return packages[index];
        }).filter(package => package != null);

        const localDevDependencies = (
            package.devDependencies
        ).map(dependency => {
            const index = packages.findIndex(package => package.name === dependency);
            if (index < 0) {
                return null;
            }
            return packages[index];
        }).filter(package => package != null);

        package.localDependencies = localDependencies;
        package.localDevDependencies = localDevDependencies;
        return package;
    });

    if (!sorted) {
        return packages;
    }

    return packages.reverse().reduce((result, package, _, packages) => {
        return unshiftPackageAndLocalDependencies(package, packages, result);
    }, []);

    function unshiftPackageAndLocalDependencies(package, packages, list) {
        list.unshift(package);
        const localDependencies = package.localDependencies.concat(
            includeDevDeps ? package.localDevDependencies : []
        );
        for (let i = localDependencies.length - 1; i >= 0; i--) {
            unshiftPackageAndLocalDependencies(
                localDependencies[i],
                packages, list
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
};