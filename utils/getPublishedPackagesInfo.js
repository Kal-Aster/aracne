const { exec } = require("child_process");

module.exports = function getPublishedPackagesInfo(
    packageNames
) {
    return packageNames.map(name => {
        return new Promise((resolve, reject) => {
            exec(
                `npm search --json ${name}`,
                { stdio: "pipe", encoding: "utf-8" },
                (error, stdout) => {
                    if (error != null) {
                        reject(error);
                    }
                    resolve(JSON.parse(
                        stdout
                    ).find(foundPackage => {
                        return foundPackage.name === name;
                    }) || null);
                }
            );
        });
    });
}