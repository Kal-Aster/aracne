const getMilestoneTags = require("./getMilestoneTags");

module.exports = function getLastKnownVersion(package) {
    const lastMilestoneTag = getMilestoneTags(package).pop();
    if (!lastMilestoneTag) {
        return null;
    }

    return lastMilestoneTag.replace(`${package.name}@`, "");
}