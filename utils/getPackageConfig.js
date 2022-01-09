const getConfig = require("./getConfig");
const isConfigValid = require("./isConfigValid");

module.exports = function getPackageConfig(
    package,
    configName,
    defaultValue
) {
    const config = getConfig()[configName];

    if (config == null) {
        return defaultValue;
    }
    
    if (isConfigValid(configName, config)) {
        return config;
    }

    const packageConfig = config[package.name];
    if (isConfigValid(configName, packageConfig)) {
        return packageConfig;
    }

    const defaultConfig = config["*"];
    if (isConfigValid(configName, defaultConfig)) {
        return defaultConfig;
    }

    return defaultValue;
}