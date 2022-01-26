const yargs = require("yargs");

const getFolderConfig = require("../utils/getFolderConfig");

(async () => {
    const { argv } = (
        yargs(process.argv.slice(2))
    );

    const [ folder ] = argv._;
    if (!folder) {
        console.log("Must specify folder");
        process.exit(1);
    }

    console.log(getFolderConfig(folder, false));
})();