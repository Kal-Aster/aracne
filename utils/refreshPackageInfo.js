const { existsSync, readFileSync } = require("fs");
const { join } = require("path");

module.exports = function refreshPackageInfo(package) {
    const { path } = package;

    const packageJSONPath = join(path, "package.json");
    if (!existsSync(packageJSONPath)) {
        return package;
    }

    const {
        name,
        version
    } = JSON.parse(readFileSync(
        packageJSONPath,
        { encoding: "utf-8" }
    ));
    
    package.name = name;
    package.version = version;
}