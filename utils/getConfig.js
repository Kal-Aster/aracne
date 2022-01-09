const getDefaultSourcePatterns = require("./getDefaultSourcePatterns");

const { existsSync, readFileSync } = require("fs");

let cached = null;
module.exports = function getConfig() {
    if (cached) {
        return cached;
    }

    const configPath = "aracne.json";
    if (!existsSync(configPath)) {
        return {
            build: null,
            source: getDefaultSourcePatterns()
        };
    }
    try {
        const {
            source,
            build: parsedBuild
        } = JSON.parse(readFileSync(
            configPath,
            { encoding: "utf-8" }
        ));

        const build = (
            (typeof parsedBuild !== "string" ?
                null : parsedBuild
            )
        );

        return cached = {
            build,
            source
        };
    } catch (e) {
        return cached = {
            build: null,
            source: getDefaultSourcePatterns()
        }
    }
}