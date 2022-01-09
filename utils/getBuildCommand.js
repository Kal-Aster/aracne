const getPackageConfig = require("./getPackageConfig")

module.exports = function getBuildcommand(package) {
    const buildCommand = getPackageConfig(
        package, "build", null
    );
    if (
        buildCommand != null &&
        typeof buildCommand === "object"
    ) {
        return buildCommand.filter(command => {
            return typeof command === "string";
        }).join("&&") || null;
    }
    return buildCommand;
}