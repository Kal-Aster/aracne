const getPackages = require("../utils/getPackages");

(async () => {
    try {
        (await getPackages({
            includeDevDeps: true
        })).forEach((package) => {
            package.manager.restoreLocalDependencies(
                package
            );
        });
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
})();