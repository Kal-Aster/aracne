const composer = require("../plugins/composer");
const npm = require("../plugins/npm");

const languages = [
    {
        name: "js",
        managers: [ npm ],
        source: "**/*.js",
        build: null,
        publish: "npm publish"
    },
    {
        name: "php",
        managers: [ composer ],
        source: "**/*.php",
        build: null,
        publish: null
    }
];

module.exports = {
    getAll() {
        return languages.map((language) => {
            return {
                ...language,
                managers: managers.map(({ name }) => name)
            };
        });
    },
    getDefaultConfig(lang, config) {
        const language = languages.filter(
            ({ name }) => name === lang
        )[0];
        if (!language) {
            return undefined;
        }

        if (config === "managers") {
            return undefined;
        }

        return language[config];
    },
    getDefaultManagerName(lang) {
        return languages.find(
            ({ name }) => name === lang
        )?.managers[0].name || null;
    },
    getLanguageOfManager(manager) {
        const langs = languages.filter(
            ({ managers }) => {
                return managers.findIndex(
                    ({ name }) => manager === name
                ) >= 0;
            }
        );
        if (langs.length === 0) {
            throw new Error(`Unknown manager ${JSON.stringify(manager)}`);
        }
        if (langs.length > 1) {
            throw new Error(`Can't determine language of manager ${
                JSON.stringify(manager)
            }.`);
        }
        return langs[0].name;
    },
    getManager(lang, manager) {
        const language = languages.find(({ name }) => name === lang);
        if (!language) {
            throw new Error(`Cannot find language ${
                JSON.stringify(lang)
            }`);
        }

        const foundManager = language.managers.find(
            ({ name }) => name === manager
        );
        if (!foundManager) {
            throw new Error(`Cannot find manager ${
                JSON.stringify(manager)
            }`);
        }

        return { ...foundManager };
    },
    isLanguageValid(lang) {
        return languages.findIndex(
            ({ name }) => name === lang
        ) >= 0;
    },
    isManagerValid(manager, lang = null) {
        return languages.filter(({ name }) => {
            return !lang || name === lang;
        }).reduce(
            (result, { managers }) => result.concat(managers), []
        ).findIndex(({ name }) => name === manager) >= 0;
    }
};