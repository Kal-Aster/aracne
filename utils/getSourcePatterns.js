const getDefaultSourcePatterns = require("./getDefaultSourcePatterns");
const getPackageConfig = require("./getPackageConfig");

module.exports = function getSourcePatterns(package) {
    const sourcePatterns = getPackageConfig(
        package,
        "source",
        getDefaultSourcePatterns()
    );
    if (typeof sourcePatterns === "string") {
        return [ sourcePatterns ];
    }
    return sourcePatterns;
};