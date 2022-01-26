const getChanged = require("../utils/getChanged");

(async () => {
    const changed = await getChanged({ filtered: true });
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