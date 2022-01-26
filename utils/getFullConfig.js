const getDefaultFullConfig = require("./getDefaultFullConfig");

const { existsSync } = require("fs");
const { join } = require("path");

module.exports = function getFullConfig() {
    const configPath = join(process.cwd(), "aracne.json");
    if (!existsSync(configPath)) {
        return getDefaultFullConfig();
    }
    return require(configPath);
}