#!/usr/bin/env node

const runCommand = require("./utils/runCommand");

try {
    runCommand(
        process.argv[2],
        process.argv.slice(3)
    );
} catch (e) {}