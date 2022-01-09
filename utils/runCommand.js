const { execSync } = require("child_process");
const { existsSync } = require("fs");
const { join } = require("path");

module.exports = function runCommand(command, args, stdio) {
    const path = join(
        module.path, "..",
        "commands",`${command}.js`
    );
    if (!existsSync(path)) {
        throw new Error(`Invalid command: ${command}`);
    }

    execSync(`node "${path}"${
        args && args.length > 0 ? " "+args.map(arg => {
            return `"${arg
                .replace("\"", "\\\"")
                .replace(/\\$/, "\\\\")
            }"`;
        }).join(" ") : ""
    }`, { stdio: stdio || "inherit", encoding: "utf-8" });
}