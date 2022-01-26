const extractFolderConfig = require("./extractFolderConfig");
const isConfigValid = require("./isConfigValid");
const Languages = require("./Languages");

module.exports = function normalizeFolderConfig(
    config, configName, folder
) {
    let value = config[configName];
    if (
        folder != null &&
        typeof value === "object" &&
        value !== null &&
        !isConfigValid(configName, value)
    ) {
        const folderConfig = extractFolderConfig(
            configName, value, folder, null
        );

        if (folderConfig.type === "default") {
            config[configName] = Languages.getDefaultConfig(
                config.lang, configName
            );
            return config;
        }
        
        config[configName] = value = folderConfig.value;
    }
    
    if (!isConfigValid(configName, value)) {
        config[configName] = value = Languages.getDefaultConfig(
            config.lang, configName
        );
    }
    
    return config;
}