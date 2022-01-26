const isConfigValid = require("./isConfigValid");
const Languages = require("./Languages");

module.exports = function normalizeFolderConfig(
    config, configName, folder
) {
    let value = config[configName];
    if (!isConfigValid(configName, value)) {
        config[configName] = value = Languages.getDefaultConfig(
            config.lang, configName
        );
    }
    
    return config;
}