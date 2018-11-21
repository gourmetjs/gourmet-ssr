"use strict";

const npath = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");
const ncp = require("ncp").ncp;
const promiseEach = require("@gourmet/promise-each");
const promiseMain = require("@gourmet/promise-main");

const TEST_DIR = npath.join(__dirname, "..");
const TARGET_DIR = npath.join(__dirname, "../../../.gourmet-standalone/tests");

function main() {
  rimraf.sync(TARGET_DIR);

  return promiseEach(fs.readdirSync(TEST_DIR), name => {
    const srcDir = npath.join(TEST_DIR, name);
    const desDir = npath.join(TARGET_DIR, name);

    const pkg = require(npath.join(srcDir, "package.json"));

    if (!pkg.scripts || !pkg.scripts.test)
      return;

    mkdirp.sync(desDir);

    return new Promise((resolve, reject) => {
      console.log(`Copying '${srcDir}' to '${desDir}'`);

      ncp(srcDir, desDir, {
        filter: path => {
          return path.indexOf("node_modules") === -1;
        },
        stopOnError: true
      }, err => {
        if (err)
          reject(err);
        else
          resolve();
      });
    });
  });
}

promiseMain(main());
