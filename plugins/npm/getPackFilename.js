module.exports = function getPackFilename(name, version) {
    return `${
        name.replace(/^@/, "").replace(/[\/\\]/g, "-")
    }-${
        version
    }.tgz`;
}