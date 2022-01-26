const getChanged = require("../utils/getChanged");

const { execSync } = require("child_process");

(async () => {
    const changed = await getChanged({
        filtered: false,
        includeDevDeps: true
    });

    for (let i = 0; i < changed.length; i++) {
        const package = changed[i];

        await package.manager.setupLocalDependencies(package);

        if (await package.manager.isPackedAndUpToDate(package)) {
            console.group(`Package ${package.name}@${package.version}:`);
            console.log(`Package already built and packed\n`);
            console.groupEnd();
            continue;
        }
        console.group(`Package ${package.name}@${package.version}:`);

        try {
            await package.manager.install(package);
        } catch (error) {
            console.log("Error installing packages");
            console.groupEnd();
            process.exit(1);
        }

        const buildCommand = package.config.build;
        if (buildCommand) {
            console.log(`Building`);
            try {
                execSync(
                    `cd "${package.folder}" && ${buildCommand}`,
                    { stdio: "inherit", encoding: "utf-8" }
                );
            } catch (error) {
                console.log("Error building");
                console.groupEnd();
                process.exit(1);
            }
        } else {
            console.log("Skipping build");
        }

        console.log(`Packing`);
        try {
            await package.manager.pack(package);
        } catch (error) {
            console.groupEnd();
            throw error;
        }

        console.groupEnd();
    }
})();
