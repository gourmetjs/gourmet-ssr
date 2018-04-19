"use strict";

const npath = require("path");
const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");

function serverArgs(args) {
  const argv = camelcaseKeys(minimist(args));
  return parse(argv);
}

function parse(argv) {
  const watch = argv.hot ? "hot" : (argv.watch ? true : false);
  const stage = argv.stage || argv.s || "local";
  const workDir = npath.resolve(process.cwd(), argv.dir || argv.d || "");
  const outputDir = npath.resolve(workDir, argv.build || ".gourmet");
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
}

serverArgs.parse = parse;

module.exports = serverArgs;
