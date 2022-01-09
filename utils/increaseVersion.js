const versionRegex = /(\d+).(\d+).(\d+)/

module.exports = function increaseVersion(version, releaseType) {
    const [, major, minor, patch] = version.match(versionRegex) || [];
    if (major == null) {
        throw new Error(`Invalid version: ${version}`);
    }
    switch (releaseType) {
        case "patch": {
            return `${
                major
            }.${
                minor
            }.${
                parseInt(patch, 10) + 1
            }`;
        }
        case "minor": {
            return `${
                major
            }.${
                parseInt(minor, 10) + 1
            }.0`;
        }
        case "major": {
            return `${
                parseInt(major, 10) + 1
            }.0.0`;
        }
        default: {
            throw new Error(`Invalid release type: ${releaseType}`);
        }
    }
}