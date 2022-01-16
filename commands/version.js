const getChanged = require("../utils/getChanged");
const getLastKnownVersion = require("../utils/getLastKnownVersion");
const increaseVersion = require("../utils/increaseVersion");
const setPackageVersion = require("../utils/setPackageVersion");
const runCommand = require("../utils/runCommand");

const yargs = require("yargs");

const { execSync } = require("child_process");
const { prompt } = require("inquirer");

(async () => {
    const { argv } = (
        yargs(process.argv.slice(2))
        .option("allow-uncommited", {
            type: "boolean",
            default: false,
            description: "Allows having uncommited changes during versioning"
        })
        .option("increase-only", {
            type: "boolean",
            default: false,
            description: "Increase only the version package without building them and commiting the changes"
        })
        .option("yes", {
            alias: "y",
            type: "boolean",
            default: false,
            description: "Skip confirmation"
        })
    );
    const [ selectedPackage, selectedVersion ] = argv._;

    if (
        !argv.allowUncommited &&
        execSync(
            "git ls-files --exclude-standard -o -m",
            { encoding: "utf-8", stdio: "pipe" }
        ).split("\n").length > 1
    ) {
        console.log(`Local repository has un-commited changes`);
        return;
    }

    let changed = getChanged({ filtered: false });
    if (changed.length === 0) {
        console.log("No packages found");
        return;
    }
    if (selectedPackage != null) {
        changed = changed.filter(({ name }) => {
            return name == selectedPackage;
        });
        if (changed.length === 0) {
            console.log(`Package "${selectedPackage}" not found`);
            return;
        }
    } else {
        changed = changed.filter(({ changed }) => changed);
        if (changed.length === 0) {
            console.log("No package has changed");
            return;
        }
    }

    const selectedVersionReleaseType = (
        (selectedVersion != null ?
            ([
                "patch", "minor", "major"
            ].includes(selectedVersion) ?
                selectedVersion : "custom"
            ) : null
        )
    )

    const selectedVersions = [];
    for (let i = 0; i < changed.length; i++) {
        const package = changed[i];

        const lastKnownVersion = getLastKnownVersion(package);
        let version;
        const {
            versionReleaseType
        } = (selectedVersionReleaseType != null ?
            { versionReleaseType: selectedVersionReleaseType } :
            await prompt({
                type: 'list',
                name: "versionReleaseType",
                message: `Select release type for "${package.name}@${package.version}"`,
                choices: [
                    "patch", "minor", "major", "custom",
                    ...(lastKnownVersion != null ? [] : [
                        "none"
                    ])
                ]
            })
        );
        switch (versionReleaseType) {
            case "none": {
                version = package.version;
                break;
            }
            case "custom": {
                let firstLoopPassed = false;
                do {
                    version = ((
                        !firstLoopPassed &&
                        selectedVersion != null
                    ) ?
                        selectedVersion :
                        (await prompt({
                            type: "input",
                            name: "version",
                            message: (firstLoopPassed ?
                                "Invalid version, insert again":
                                "Insert custom version"
                            ),
                            default: (selectedPackage != null ?
                                undefined : package.version
                            )
                        })).version
                    ).trim();
                    firstLoopPassed = true;

                    const [ newMajor, newMinor, newPatch ] = (
                        version.match(/(\d+).(\d+).(\d+)/) || []
                    );
                    if (newMajor == null) {
                        continue;
                    }

                    const [ currentMajor, currentMinor, currentPatch ] = (
                        package.version.match(/(\d+).(\d+).(\d+)/) || []
                    );
                    if (
                        newMajor > currentMajor ||
                        newMinor > currentMinor ||
                        newPatch > currentPatch
                    ) {
                        break;
                    }
                } while(true);
                break;
            }
            default: {
                version = increaseVersion(
                    package.version,
                    versionReleaseType
                );
                break;
            }
        }
        selectedVersions.push([ package, version ]);
    }

    process.stdout.write("\n");
    selectedVersions.forEach(([{name, version}, newVersion]) => {
        process.stdout.write(`${name}\n  ${version} → ${newVersion}\n\n`);
    });

    if (
        !argv.yes &&
        !(await prompt({
            type: "confirm",
            name: "confirm",
            message: "Confirm above version changes?"
        })).confirm
    ) {
        return;
    }

    selectedVersions.forEach(([package, version]) => {
        setPackageVersion(package, version);
    });

    if (argv.increaseOnly) {
        return;
    }

    runCommand("build");
    [
        "git add -A",
        `git commit -m "chore: increased versions" -m "${
            changed.map(({ name, version }) => {
                return ` - ${name}@${version}`;
            }).join("\n")
        }"`,
        ...changed.map(({ name, version}) => {
            return `git tag "${name}@${version}" HEAD`
        })
    ].forEach(command => {
        execSync(
            command,
            { stdio: "pipe", encoding: "utf-8" }
        );
    });
})();