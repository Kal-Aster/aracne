const globrex = require("globrex")

module.exports = function convertSourcePatternToPathRegExp(
    path, sourcePattern
) {
    return globrex(`${
        path.replace(/[\\\/]+/, "/")
    }/${
        sourcePattern.replace(/^\.?(\\\\|\/)/, "")
    }`.replace(/^\/|\/$/g, ""), {
        globstar: true, extended: true
    }).regex;
};