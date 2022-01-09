const { execSync } = require("child_process");

module.exports = function tagCommitAsMilestone(
    package, commitId = "HEAD"
) {
    const milestoneTag = `${package.name}@${package.version}`;
    if (execSync(
        `git tag -l "${milestoneTag}"`,
        { encoding: "utf-8", stdio: "pipe" }
    ).slice(0, -1) !== "") {
        throw new Error(
            `Package "${
                package.name
            }" has already a milestone for version ${
                package.version
            }`
        );
    }

    execSync(
        `git tag "${milestoneTag}" ${commitId}`,
        { stdio: "ignore" }
    );
}