const getSourcePatterns = require("./getSourcePatterns");

const { lstatSync, readdirSync } = require("fs");
const { join } = require("path");
const convertSourcePatternToPathRegExp = require("./convertSourcePatternToPathRegExp");

function walkDirectoryFiles(path, callback, root = true) {
    readdirSync(path).forEach(file => {
        if (root && file === "node_modules") {
            return;
        }

        const filePath = join(path, file);
        if (lstatSync(filePath).isDirectory()) {
            return walkDirectoryFiles(
                filePath, callback, false
            );
        }
        callback(filePath);
    });
}

module.exports = function getMostRecentMTimeMs(package) {
    let mostRecentMTimeMs = 0;
    const sourcePatternRegexes = (
        getSourcePatterns(package).map(pattern => {
            return convertSourcePatternToPathRegExp(
                package.path, pattern
            );
        })
    );

    walkDirectoryFiles(package.path, file => {
        if (!sourcePatternRegexes.some(regex => {
            return file.match(regex) != null;
        })) {
            return;
        }

        const { mtimeMs } = lstatSync(file);
        if (mtimeMs <= mostRecentMTimeMs) {
            return;
        }
        mostRecentMTimeMs = mtimeMs;
    });

    return mostRecentMTimeMs;
}