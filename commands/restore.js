const getPackages = require("../utils/getPackages");

(async () => {
    (await getPackages({
        includeDevDeps: true
    })).forEach((package) => {
        package.manager.restoreLocalDependencies(package);
    });
})();