const { execSync } = require("child_process");

module.exports = function getMilestoneTags(package) {
    return execSync(
        `git tag -l "${package.name}@*"`,
        { encoding: "utf-8", stdio: "pipe" }
    ).split("\n").slice(0, -1).map(tag => {
        const [,
            major,
            minor,
            patch
        ] = tag.match(new RegExp(
            `${package.name}@(\\d+).(\\d+).(\\d+)$`
        )) || [];
        if (!major) {
            return null;
        }
        return {
            major: parseInt(major, 10),
            minor: parseInt(minor, 10),
            patch: parseInt(patch, 10)
        };
    }).sort((a, b) => {
        if (a == null) {
            return 0;
        }
        if (b == null) {
            return 1;
        }
        if (a.major !== b.major) {
            return a.major > b.major ? 1 : 0;
        }
            if (a.minor !== b.minor) {
            return a.minor > b.minor ? 1 : 0;
        }
            if (a.patch !== b.patch) {
            return a.patch > b.patch ? 1 : 0;
        }
        return 0;
    }).map(({ major, minor, patch }) => {
        return `${
            package.name
        }@${
            major
        }.${
            minor
        }.${
            patch
        }`;
    });
}