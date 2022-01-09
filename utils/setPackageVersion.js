const getPackedPackagesPath = require("./getPackedPackagesPath");
const getPackFilename = require("./getPackFilename");

const { readFileSync, rmSync, writeFileSync } = require("fs");
const { join } = require("path");

module.exports = function setPackageVersion(
    package, version
) {
    if (package.version === version) {
        return;
    }

    const packFilename = getPackFilename(package);
    const packedPackagesPath = getPackedPackagesPath();
    rmSync(join(
        packedPackagesPath,
        packFilename
    ), { force: true });

    const packageJSONPath = join(
        package.path, "package.json"
    );
    let packageJSONContent = readFileSync(
        packageJSONPath, { encoding: "utf-8" }
    );

    let bracketCount = 0;
    let versionUpdated = false;
    for (let i = 0; i < packageJSONContent.length; i++) {
        const char = packageJSONContent[i];
        if (char === "{") {
            bracketCount++;
            continue;
        }
        if (char === "}") {
            bracketCount--;
            continue;
        }
        if (bracketCount !== 1) {
            continue;
        }

        if (char !== "v") {
            continue;
        }
        const match = packageJSONContent.substr(
            i - 1
        ).match(
            /^"version"\s*:\s*"(.*)"/
        );
        if (match == null) {
            continue;
        }
        const { index } = match[0].match(
            new RegExp(`(?<=^"version"\\s*:\\s*")${
                match[1]
            }(?=")`)
        );
        const startIndex = i - 1 + match.index + index;
        const endIndex = startIndex + match[1].length;

        packageJSONContent = (
            packageJSONContent.substr(0, startIndex) +
            version +
            packageJSONContent.substr(endIndex)
        );
        versionUpdated = true;
        break;
    }

    if (!versionUpdated) {
        throw new Error("Couldn't update version");
    }

    writeFileSync(packageJSONPath, packageJSONContent);
    package.version = version;
};