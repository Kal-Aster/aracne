const getPackages = require("../utils/getPackages");
const restorePackage = require("../utils/restorePackage");

getPackages({
    includeDevDeps: true
}).forEach(restorePackage);