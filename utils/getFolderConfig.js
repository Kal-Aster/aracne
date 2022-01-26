const extractFolderConfig = require("./extractFolderConfig");
const getDefaultFullConfig = require("./getDefaultFullConfig");
const getFullConfig = require("./getFullConfig");
const normalizeConfig = require("./normalizeConfig");

function getDefaultConfig() {
    return getDefaultFullConfig().packages["*"];
}

function deepCopy(object) {
    if (typeof object !== "object" || object === null) {
        return object;
    }
    if (Array.isArray(object)) {
        return object.reduce((result, item) => {
            result.push(deepCopy(item));
            return result;
        }, []);
    }
    const copy = {};
    for (let key in object) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) {
            continue;
        }
        copy[key] = deepCopy(object[key]);
    }

    return copy;
}

module.exports = function getFolderConfig(folder) {
    const {
        type,
        value
    } = extractFolderConfig(
        null, getFullConfig().packages, folder, null
    );
    if (type === "default") {
        return getDefaultConfig();
    }
    return normalizeConfig(
        deepCopy(value),
        folder, type === "specific"
    );
}