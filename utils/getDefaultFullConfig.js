module.exports = function getDefaultFullConfig() {
    return {
        "lang": "js",
        "source": "**/*.js",
        "packages": {
            "packages/*": null,
            "packages/api": {
                "lang": "php"
            }
        }
    };
    // return [
    //     {
    //         "lang": "js",
    //         "source": "**/*.js",
    //         "packages": "packages/*"
    //     }
    // ];
}