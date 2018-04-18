"use strict";

const npath = require("path");
const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");

module.exports = function serverArgs(args) {
  const argv = camelcaseKeys(minimist(args));

  const watch = argv.hot ? "hot" : (argv.watch ? true : false);
  const stage = argv.stage || argv.s || "local";
  const workDir = npath.resolve(process.cwd(), argv.dir || argv.d || "");
  const outputDir = npath.resolve(workDir, argv.out || ".gourmet");
  const serverDir = npath.join(outputDir, stage, "server");
  const clientDir = npath.join(outputDir, stage, "client");

  return {
    argv,
    watch,
    stage,
    workDir,
    outputDir,
    clientDir,
    serverDir
  };
};
