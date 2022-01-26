const getMilestoneTags = require("./getMilestoneTags");
const getMostRecentMTimeMs = require("./getMostRecentMTimeMs");
const getPackages = require("./getPackages");

const { execSync } = require("child_process");
const { lstatSync } = require("fs");

const defaultOptions = {
    onlyDirectly: false,
    filtered: true,
    includeDevDeps: false
};

module.exports = async function getChanged({
    onlyDirectly,
    filtered,
    includeDevDeps
} = defaultOptions) {
    onlyDirectly = onlyDirectly ?? defaultOptions.onlyDirectly;
    filtered = onlyDirectly || (filtered ?? defaultOptions.filtered);
    includeDevDeps = includeDevDeps ?? defaultOptions.includeDevDeps;

    const unstagedChanges = execSync(
        "git ls-files --exclude-standard -o -m",
        { encoding: "utf-8", stdio: "pipe" }
    ).split("\n").slice(0, -1);

    const result = (await getPackages({
        includeDevDeps
    })).map(package => {
        const lastMilestoneTag = getMilestoneTags(package).pop() ?? null;
        const changes = (lastMilestoneTag == null ?
            null : execSync(
                `git diff "${lastMilestoneTag}" --raw --name-only`,
                { encoding: "utf-8", stdio: "pipe" }
            ).split("\n").slice(0, -1).concat(
                unstagedChanges
            )
        );

        let mostRecentChangedTime = (changes === null ?
            getMostRecentMTimeMs(package) : null
        );
        const directlyChanged = (changes === null ?
            mostRecentChangedTime !== 0 :
            changes.reduce((result, change) => {
                if (!package.config.source.some(regex => {
                    return change.match(regex) != null;
                })) {
                    return result;
                }

                const { mtimeMs } = lstatSync(change);
                if (mostRecentChangedTime < mtimeMs) {
                    mostRecentChangedTime = mtimeMs;
                }

                return true;
            }, false)
        );
        
        const localDependencies = package.localDependencies.concat(
            package.localPeerDependencies
        ).concat(
            includeDevDeps ? package.localDevDependencies : []
        );
        mostRecentChangedTime = localDependencies.reduce(
            (mostRecentChangedTime, dep) => {
                if (dep.mostRecentChangedTime > mostRecentChangedTime) {
                    return dep.mostRecentChangedTime;
                }
                return mostRecentChangedTime;
            }, mostRecentChangedTime ?? 0
        );
        const depsChanged = localDependencies.some(dep => dep.changed);
        const changed = directlyChanged || depsChanged;

        Object.defineProperties(package, {
            changed: {
                get() { return changed; },
                configurable: true
            },
            directlyChanged: {
                get() { return directlyChanged; },
                configurable: true
            },
            mostRecentChangedTime: {
                get() { return mostRecentChangedTime; },
                configurable: true
            }
        })

        return package;
    });

    if (filtered) {
        return result.filter(package => (onlyDirectly ?
            package.directlyChanged : package.changed
        ));
    }
    return result;
};