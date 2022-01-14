const convertSourcePatternToPathRegExp = require("./convertSourcePatternToPathRegExp");
const getPackages = require("./getPackages");
const getSourcePatterns = require("./getSourcePatterns");

const { execSync } = require("child_process");
const { lstatSync } = require("fs");
const getMostRecentMTimeMs = require("./getMostRecentMTimeMs");
const getMilestoneTags = require("./getMilestoneTags");

const defaultOptions = {
    onlyDirectly: false,
    filtered: true,
    includeDevDeps: false
};

module.exports = function getChanged({
    onlyDirectly,
    filtered,
    includeDevDeps
} = defaultOptions) {
    onlyDirectly = onlyDirectly ?? defaultOptions.onlyDirectly;
    filtered = filtered ?? defaultOptions.filtered;
    includeDevDeps = includeDevDeps ?? defaultOptions.includeDevDeps;

    const unstagedChanges = execSync(
        "git ls-files --exclude-standard -o -m",
        { encoding: "utf-8", stdio: "pipe" }
    ).split("\n").slice(0, -1);

    const result = getPackages({
        includeDevDeps
    }).map(package => {
        const lastMilestoneTag = getMilestoneTags(package).pop() ?? null;
        const changes = (lastMilestoneTag == null ?
            null : execSync(
                `git diff "${lastMilestoneTag}" --raw --name-only`,
                { encoding: "utf-8", stdio: "pipe" }
            ).split("\n").slice(0, -1).concat(
                unstagedChanges
            )
        );

        const sourcePatternRegexes = (
            getSourcePatterns(package).map(pattern => {
                return convertSourcePatternToPathRegExp(
                    package.path, pattern
                );
            })
        );
        
        let mostRecentChangedTime = changes === null ? getMostRecentMTimeMs(package) : null;
        const directlyChanged = (changes === null ?
            mostRecentChangedTime !== 0 :
            changes.reduce((result, change) => {
                if (!sourcePatternRegexes.some(regex => {
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
        package.directlyChanged = directlyChanged;

        const localDependencies = package.localDependencies.concat(
            package.localPeerDependencies
        ).concat(
            includeDevDeps ? package.localDevDependencies : []
        );
        package.mostRecentChangedTime = localDependencies.reduce(
            (mostRecentChangedTime, dep) => {
                if (dep.mostRecentChangedTime > mostRecentChangedTime) {
                    return dep.mostRecentChangedTime;
                }
                return mostRecentChangedTime;
            }, mostRecentChangedTime ?? 0
        );
        package.changed = (
            directlyChanged ||
            localDependencies.some(dep => dep.directlyChanged)
        );

        return package;
    });

    if (filtered) {
        return result.filter(package => (onlyDirectly ?
            package.directlyChanged : package.changed
        ));
    }
    return result;
};