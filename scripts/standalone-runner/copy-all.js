"use strict";

const npath = require("path");
const fs = require("fs");
const nutil = require("util");
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");
const ncp = require("ncp").ncp;
const promiseEach = require("@gourmet/promise-each");
const promiseMain = require("@gourmet/promise-main");

const TEST_DIR = npath.join(__dirname, "..");
const TARGET_DIR = npath.join(__dirname, "../../../.gourmet-standalone/tests");

async function main() {
  await nutil.promisify(rimraf)(TARGET_DIR);

  await promiseEach(fs.readdirSync(TEST_DIR), async name => {
    const srcDir = npath.join(TEST_DIR, name);
    const desDir = npath.join(TARGET_DIR, name);

    const pkg = require(npath.join(srcDir, "package.json"));

    if (!pkg.scripts || !pkg.scripts.test)
      return;

    mkdirp.sync(desDir);

    console.log(`Copying '${srcDir}' to '${desDir}'`);

    await nutil.promisify(ncp)(srcDir, desDir, {
      filter: path => {
        return path.indexOf("node_modules") === -1;
      },
      stopOnError: true
    });
  });
}

promiseMain(main());
