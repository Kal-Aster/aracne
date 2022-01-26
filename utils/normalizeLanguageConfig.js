const getDefaultFullConfig = require("./getDefaultFullConfig");
const Languages = require("./Languages");

module.exports = function normalizeLanguageConfig(config) {
    const hasLang = Object.prototype.hasOwnProperty.call(
        config, "lang"
    );
    const hasManager = Object.prototype.hasOwnProperty.call(
        config, "manager"
    );

    if (!hasLang && !hasManager) {
        config.lang = "js";
        config.manager = Languages.getDefaultManagerName("js");
        return config;
    }
    
    const langValid = (hasLang ?
        Languages.isLanguageValid(config.lang) : null
    );
    const managerValid = (hasManager ?
        (langValid ?
            Languages.isManagerValid(config.manager, config.lang) :
            Languages.isManagerValid(config.manager)
        ) : null
    );

    if (langValid && managerValid) {
        return config;
    }

    if (langValid === false) {
        throw new Error(`Unrecognized language (${
            JSON.stringify(config.lang)
        })`);
    }
    if (managerValid === false) {
        throw new Error(`Unrecognized manager (${
            JSON.stringify(config.manager)
        })`);
    }

    if (langValid) {
        config.manager = Languages.getDefaultManagerName(config.lang);
    } else if (managerValid) {
        config.lang = Languages.getLanguageOfManager(config.manager);
    }
    return config;
}