const runCommand = require("../utils/runCommand");

const { execSync } = require("child_process");
const { lstatSync, existsSync, readFileSync } = require("fs");
const { prompt } = require("inquirer");
const { join, basename } = require("path");

(async () => {
    if (
        execSync(
            "git ls-files --exclude-standard -o -m",
            { encoding: "utf-8", stdio: "pipe" }
        ).split("\n").length > 1 /*&&
        !(await prompt({
            type: "confirm",
            name: "confirm",
            message: "Local repository has un-commited changes\nContinue anyway?",
            default: false
        })).confirm */
    ) {
        console.log("Local repository has un-commited changes");
        return;
    }

    const path = process.argv[2];
    if (!path) {
        console.log("Specify path of the repository to import");
        return;
    }

    if (!existsSync(path)) {
        console.log(`"${path}" path does not exist`);
        return;
    }
    if (!lstatSync(path).isDirectory()) {
        console.log(`"${path}" is not a directory`);
        return;
    }
    if (!existsSync(join(path, "package.json"))) {
        console.log(`"${path}" is not a package`);
        return;
    }
    
    const externalHasUncommitedChanges = execSync(
        [
            `cd "${path}"`,
            "git ls-files --exclude-standard -o -m",
        ].join(" && "),
        { encoding: "utf-8", stdio: "pipe" }
    ).split("\n").length > 1;
    if (
        externalHasUncommitedChanges &&
        !(await prompt({
            type: "confirm",
            name: "confirm",
            message: "External repository has un-commited changes\nContinue anyway?",
            default: false
        })).confirm
    ) {
        return;
    }

    if (!externalHasUncommitedChanges) {
        const { version } = JSON.parse(readFileSync(
            join(path, "package.json"),
            { encoding: "utf-8" }
        ));
        if (typeof version !== "string") {
            console.log(`Package version is not a string`);
            return;
        }
        if (version.match(/\d+.\d+.\d+/) === null) {
            console.log("Unsupported version type");
            return;
        }
    }
    
    const commits = execSync(
        `cd "${path}" && git log --format=%h`,
        { encoding: "utf-8", stdio: "pipe" }
    ).split("\n").slice(0, -1).reverse();
    if (commits.length === 0) {
        console.log("There are no commits to import");
        return;
    }

    const packagePath = `packages/${basename(path)}`;

    const preImportHead = execSync(
        "git log --format=%h -1",
        { encoding: "utf-8", stdio: "pipe" }
    );

    const maxBuffer = 50 * 1024 * 1024;
    if (commits.some(sha => {
        console.log(`Importing commit ${sha}`);
    
        // thanks to lerna for the next patch and git commands
        // https://github.com/lerna/lerna/blob/a47fc294393a3e9507a8207a5a2f07648a524722/commands/import/index.js#L148
        const replacement = `$1/${packagePath}`;
        const patch = (
            execSync(
                `cd "${path}" && git format-patch -1 ${
                    sha
                } --stdout --src-prefix=COMPARE_A/ --dst-prefix=COMPARE_B/`,
                {
                    encoding: "utf-8", stdio: "pipe", maxBuffer
                }
            ).slice(0, -1)
            .replace(/^([-+]{3} "?COMPARE_[AB])/gm, replacement)
            .replace(/^(diff --git "?COMPARE_A)/gm, replacement)
            .replace(/^(diff --git (?! "?COMPARE_B\/).+ "?COMPARE_B)/gm, replacement)
            .replace(/^(copy (from|to)) ("?)/gm, `$1 $3${packagePath}/`)
            .replace(/^(rename (from|to)) ("?)/gm, `$1 $3${packagePath}/`)
        );
        try {
            execSync(
                `git am -3 --keep-non-patch`,
                {
                    encoding: "utf-8", stdio: "pipe",
                    input: patch, maxBuffer
                }
            );
        } catch (e) {
            // Getting commit diff to see if it's empty
            const diff = execSync(
                `cd "${path}" && git diff -s ${sha}^!`,
                { encoding: "utf-8", stdio: "pipe" }
            );
            if (diff === "") {
                execSync(
                    "git am --skip",
                    { stdio: "ignore", encoding: "utf-8" }
                );
                return false;
            }
            return true;
        }
        return false;
    })) {
        execSync(
            "git am --abort",
            { stdio: "ignore", encoding: "utf-8" }
        );
        execSync(
            `git reset --hard ${preImportHead}`,
            { stdio: "ignore", encoding: "utf-8" }
        );
        return;
    }
    
    console.log("All commits imported");
    
    const { version, name } = JSON.parse(readFileSync(
        join(packagePath, "package.json"),
        { encoding: "utf-8" }
    ));
    if (typeof version !== "string") {
        console.log(`Package version is not a string: reverting import`);
        execSync(
            `git reset --hard ${preImportHead}`,
            { stdio: "ignore", encoding: "utf-8" }
        );
        return;
    }
    if (version.match(/\d+.\d+.\d+/) === null) {
        console.log("Unsupported version type: reverting import");
        execSync(
            `git reset --hard ${preImportHead}`,
            { stdio: "ignore", encoding: "utf-8" }
        );
        return;
    }
    runCommand("build");
    execSync("git add -A", { stdio: "ignore" });
    if (execSync(
        "git diff HEAD --name-only",
        { stdio: "pipe", encoding: "utf-8" }
    ).slice(0, -1) !== "") {
        execSync(`git commit -m "chore: import package ${name}@${version}"`);
    }

    execSync(
        `git tag "${name}@${version}" HEAD`,
        { stdio: "ignore", encoding: "utf-8" }
    );
})();