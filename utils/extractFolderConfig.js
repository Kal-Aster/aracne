const isConfigValid = require("./isConfigValid");

function isValid(config, configName) {
    const configValue = config[configName];

    return (
        configValue != null &&
        typeof config[configName] === "object"
    );
}

module.exports = function extractFolderConfig(
    configType, config, folder, defaultValue
) {
    if (!config) {
        return {
            type: "default",
            value: defaultValue
        };
    }
    if (
        (
            configType === null &&
            isValid(config, folder)
        ) ||
        (
            folder in config &&
            isConfigValid(configType, config[folder])
        )
    ) {
        return {
            type: "specific",
            value: config[folder]
        };
    }
    if (
        (
            configType === null &&
            isValid(config, "*")
        ) ||
        (
            "*" in config &&
            isConfigValid(configType, config["*"])
        )
    ) {
        return {
            type: "generic",
            value: config["*"]
        };
    }
    return {
        type: "default",
        value: defaultValue
    };
}