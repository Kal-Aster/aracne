const getChanged = require("../utils/getChanged");
const getPublishedPackagesInfo = require("../utils/getPublishedPackagesInfo");
const refreshPackageInfo = require("../utils/refreshPackageInfo");
const runCommand = require("../utils/runCommand");

const { execSync } = require("child_process");
const { prompt } = require("inquirer");

(async () => {
    runCommand("version");
    runCommand("restore");
    const changed = getChanged({
        includeDevDeps: true,
        filtered: false
    });
    const publishedPackagesInfo = getPublishedPackagesInfo(
        changed.map(({ name }) => name)
    );

    const commands = Array.from({
        length: changed.length
    }).fill(null);
    let versionConflict = [];
    for (let i = 0; i < changed.length; i++) {
        const package = changed[i];

        const publishedPackageInfo = await publishedPackagesInfo[i];
        if (
            publishedPackageInfo != null &&
            publishedPackageInfo.version === package.version
        ) {
            if (!package.changed) {
                continue;
            }
            versionConflict.push([package, i]);
            continue;
        }
        
        const access = (publishedPackageInfo == null ?
            (await prompt({
                type: "list",
                name: "access",
                message: `Specify access type for "${package.name}"`,
                choices: [ "private", "public" ],
                default: "public"
            })).access : null
        );
        commands[i] = (`cd "${package.path}" && npm publish${
            access != null ? ` --access ${access}` : ""
        }`);
    }

    while (versionConflict.length > 0) {
        const [package, i] = versionConflict.shift();
        runCommand("version", [ package.name ]);

        refreshPackageInfo(package);

        const publishedPackageInfo = await publishedPackagesInfo[i];
        if (publishedPackageInfo.version === package.version) {
            versionConflict.unshift([package, i]);
            continue;
        }

        commands[i] = (`cd "${package.path}" && npm publish${
            access != null ? ` --access ${access}` : ""
        }`);
    }

    commands
    .filter(command => command != null)
    .forEach(command => {
        execSync(command, {
            stdio: "inherit",
            encoding: "utf-8"
        });
    });
    runCommand("build");
})();