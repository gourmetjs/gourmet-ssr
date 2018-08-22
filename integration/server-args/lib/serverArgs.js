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
  const outputDir = npath.resolve(workDir, argv.outputDir || ".gourmet");
  const serverDir = argv.serverDir ? npath.resolve(workDir, argv.serverDir) : npath.join(outputDir, stage, "server");
  const clientDir = argv.clientDir ? npath.resolve(workDir, argv.clientDir) : npath.join(outputDir, stage, "client");
  const staticPrefix = argv.staticPrefix || "/s/";

  return {
    argv,
    watch,
    stage,
    workDir,
    outputDir,
    clientDir,
    serverDir,
    staticPrefix
  };
}

serverArgs.parse = parse;

module.exports = serverArgs;
