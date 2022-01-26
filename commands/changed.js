const getChanged = require("../utils/getChanged");

(async () => {
    let changed;
    try {
        changed = await getChanged({
            filtered: false
        });
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
    console.group(`${changed.length} packages has changed`);
    changed.forEach(({
        name, directlyChanged,
        changed, config
    }) => {
        if (!changed) {
            return;
        }
        console.log(`${
            name
        } changed${
            directlyChanged ? " (directly)" : ""
        } [${
            config.lang
        }]`);
    });
    console.groupEnd();
})();