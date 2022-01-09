const getChanged = require("../utils/getChanged");

const changed = getChanged()
console.group(`${changed.length} packages has changed`);
changed.forEach(({ name, directlyChanged, changed, mostRecentChangedTime }) => {
    if (!changed) {
        return;
    }
    console.log(name, `changed${ directlyChanged ? " (directly)" : "" }`);
});
console.groupEnd();