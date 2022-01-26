const convertSourcePatternToPathRegExp = require("./convertSourcePatternToPathRegExp");
const normalizeFolderConfig = require("./normalizeFolderConfig");
const normalizeLanguageConfig = require("./normalizeLanguageConfig");

module.exports = function normalizeConfig(
    config, folder, convertSourcePatterns = true
) {
    normalizeLanguageConfig(config);
    [
        "build",
        "publish",
        "source"
    ].forEach(configName => {
        normalizeFolderConfig(config, configName);
        switch (configName) {
            case "build": {
                if (Array.isArray(config.build)) {
                    config.build = config.build.join(" && ");
                }
                break;
            }
            case "source": {
                if (!convertSourcePatterns) {
                    break;
                }

                if (typeof config.source === "string") {
                    config.source = [ config.source ];
                }
                config.source = config.source.map(source => {
                    return convertSourcePatternToPathRegExp(folder, source);
                });
                break;
            }
        }
    });
    
    return config;
}