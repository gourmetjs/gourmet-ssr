"use strict";

const npath = require("path");
const readline = require("readline");

const TARGET_DIR = npath.join(__dirname, "../../../.gourmet-standalone");
const CHROMIUM_DIR = npath.join(__dirname, "../../node_modules/puppeteer/.local-chromium");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

console.log(`This script will create a temporary directory at '${TARGET_DIR}',`);
console.log("copies all the tests into it, install their dependencies from NPM, and run them.");
console.log("The directory must be located outside of the 'gourmet-ssr' repo, where you are currently located.");
console.log(`Also, this script depends on the locally installed Chromium at '${CHROMIUM_DIR}'.`);
console.log("Press enter when ready...");

rl.on("line", () => {
  process.exit(0);
});
