const configValidator = {
    build: value => {
        switch (typeof value) {
            case "string": {
                return value !== "";
            }
            case "object": {
                return (
                    value === null ||
                    Array.isArray(value)
                );
            }
            default: return false;
        }
    },
    source: value => {
        switch (typeof value) {
            case "string": {
                return value !== "";
            }
            case "object": {
                return Array.isArray(value);
            }
            default: return false;
        }
    },
    publish: value => {
        switch (typeof value) {
            case "string": {
                return value !== "";
            }
            case "object": {
                return (
                    value === null ||
                    Array.isArray(value)
                );
            }
            default: return false;
        }
    }
}

module.exports = function isConfigValid(type, value) {
    return (
        type in configValidator &&
        configValidator[type](value)
    );
}