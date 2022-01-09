#!/usr/bin/env node

const runCommand = require("./utils/runCommand");

runCommand(
    process.argv[2],
    process.argv.slice(3)
);