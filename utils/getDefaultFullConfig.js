module.exports = function getDefaultFullConfig() {
    return {
        "packages": {
            "*": {
                lang: "js",
                manager: "npm",
                publish: "npm publish",
                build: null,
                source: "**/*.js"
            }
        }
    };
}