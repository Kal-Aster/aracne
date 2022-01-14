const replaceDependencyOrigin = require("./replaceDependencyOrigin");

const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

module.exports = function restorePackage(package) {
    const localDependencies = package.localDependencies.concat(
        package.localPeerDependencies
    ).concat(
        package.localDevDependencies
    );
    if (localDependencies.length === 0) {
        return;
    }

    const packageJSONPath = join(package.path, "package.json");
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
};