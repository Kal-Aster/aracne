const convertSourcePatternToPathRegExp = require("./convertSourcePatternToPathRegExp");
const getCorrespondingGroups = require("./getCorrespondingGroups");
const getFullConfig = require("./getFullConfig");
const normalizeConfig = require("./normalizeConfig");

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

function ensureArray(obj) {
    return Array.isArray(obj) ? obj : [obj];
}

function reduceScoreFn(result, group) {
    switch (true) {
        case (
            group[1] === "*"
        ): return result + 0;
        case (
            group[1][0] === "*" ||
            group[1][0] === "!"
        ): return result + 1;
        case (
            group[1][0] === "+" ||
            group[1][0] === "?"
        ): return result + 2;
        case (
            group[1][0] === "@"
        ): return result + 3;
    }
}

module.exports = function getFolderConfig(folder, convertSourcePatterns = true) {
    const fullConfig = ensureArray(getFullConfig());

    const matchingConfig = [];

    fullConfig.forEach(config => {
        let { packages } = config;
        if (!packages) {
            throw new Error(
                "Invalid config: no packages defined"
            );
        }

        if (typeof packages === "string") {
            packages = { [packages]: null };
        } else if (Array.isArray(packages)) {
            packages = packages.reduce((result, package) => {
                if (typeof package !== "string") {
                    throw new Error(
                        "Invalid config: package glob must be a string"
                    );
                }
                result[package] = null;
                return result;
            }, {});
        } else if (typeof packages !== "object") {
            throw new Error(
                "Invalid config: package must be a string, an array or an object"
            );
        }

        Object.entries(packages).forEach(([ key, value ]) => {
            const regex = convertSourcePatternToPathRegExp("", key);

            if (!folder.match(regex)) {
                return;
            }

            matchingConfig.push({
                ...value,
                glob: key
            });
        });
        
        matchingConfig.forEach((value, index, array) => {
            array[index] = {
                ...config,
                ...value,
                groups: getCorrespondingGroups(
                    folder, value.glob
                )
            };
        });
    });
    const result = normalizeConfig(
        deepCopy(matchingConfig.sort((a, b) => {
            if (a.groups.length !== b.groups.length) {
                return a.groups.length > b.groups.length ? -1 : 1
            }
            const aScore = a.groups.reduce(reduceScoreFn, 0);
            const bScore = b.groups.reduce(reduceScoreFn, 0);

            return aScore - bScore;
        }).reduce((result, value) => {
            return {
                ...result,
                ...value
            };
        }, {})), folder, convertSourcePatterns
    );

    delete result.packages;
    delete result.glob;
    delete result.groups;

    return result;
}