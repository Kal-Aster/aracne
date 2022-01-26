const getDefaultFullConfig = require("./getDefaultFullConfig");

const { existsSync } = require("fs");
const { join } = require("path");

module.exports = function getFullConfig() {
    const configPath = join(process.cwd(), "aracne.config.js");
    if (!existsSync(configPath)) {
        return getDefaultFullConfig();
    }
    return require(configPath);
}