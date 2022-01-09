module.exports = function getPackFilename(package) {
    return `${
        package.name.replace(/^@/, "").replace(/[\/\\]/g, "-")
    }-${
        package.version
    }.tgz`;
}