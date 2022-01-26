const { lstatSync, readdirSync } = require("fs");
const { join } = require("path");

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

    walkDirectoryFiles(package.folder, file => {
        file = file.replace(/[\\\/]+/g, "/");
        if (!package.config.source.some(regex => {
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