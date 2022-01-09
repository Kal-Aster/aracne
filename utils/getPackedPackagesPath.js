module.exports = function getPackedPackagesPath(relative = false) {
    if (!relative) {
        return "packed_packages";
    }
    return `../../${getPackedPackagesPath(false)}`;
}