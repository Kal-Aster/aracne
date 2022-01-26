const escapeRegExpSource = require("./escapeRegExpSource");

module.exports = function replaceDependencyOrigin(
    packageJSON,
    dependency,
    origin
) {
    const regex = new RegExp(
        `"(?:d|devD|peerD)?ependencies":\\s*{\\s*(?:"[^"]*":\\s*"[^"]*",\\s*)*"${
            escapeRegExpSource(dependency)
        }":\\s*"([^"]*)"`, "g"
    );
    return packageJSON.replace(regex, function (match, actualOrigin) {
        const index = match.lastIndexOf(actualOrigin);
        return match.substr(0, index) + origin.replace(/\\/g, "/") + match.substr(index + actualOrigin.length);
    });
};