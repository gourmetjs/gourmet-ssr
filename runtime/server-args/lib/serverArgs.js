"use strict";

const npath = require("path");
const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");

module.exports = function serverArgs(argv) {
  argv = minimist(argv);
  argv = camelcaseKeys(argv);

  const watch = argv.hot ? "hot" : (argv.watch ? true : false);
  const stage = argv.stage || argv.s || "local";
  const workDir = npath.resolve(process.cwd(), argv.dir || argv.d || "");
  const outputDir = npath.resolve(workDir, argv.out || ".gourmet");
  const serverDir = npath.resolve(outputDir, argv.serverDir || `${stage}/server`);
  const clientDir = npath.resolve(outputDir, argv.clientDir || `${stage}/client`);

  return {
    watch,
    stage,
    workDir,
    outputDir,
    clientDir,
    serverDir
  };
};
