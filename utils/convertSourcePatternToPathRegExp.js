const globrex = require("globrex")

module.exports = function convertSourcePatternToPathRegExp(
    path, sourcePattern
) {
    return globrex(`${
        path.replace(/[\\\/]+/, "/")
    }/${
        sourcePattern.replace(/^\.?(\\\\|\/)/, "")
    }`, { globstar: true, extended: true }).regex;
};