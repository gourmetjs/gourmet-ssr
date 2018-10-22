"use strict";

const npath = require("path");
const merge = require("@gourmet/merge");
const cliArgs = require("@gourmet/cli-args");

module.exports = function serverArgs(def, argv, options) {
  def = Object.assign({
    watch: undefined,
    stage: "local",
    workDir: undefined,
    outputDir: undefined,
    serverDir: undefined,
    clientDir: undefined,
    port: process.env.PORT || 3000,
    host: process.env.HOST || "0.0.0.0"
  }, def);

  options = merge({
    alias: {
      workDir: ["dir", "d"],
      stage: ["s"]
    }
  }, options);

  const args = cliArgs(def, argv, options);

  args.workDir = npath.resolve(process.cwd(), args.workDir || "");
  args.outputDir = npath.resolve(args.workDir, args.outputDir || ".gourmet");
  args.serverDir = npath.resolve(args.outputDir, args.serverDir || `${args.stage}/server`);
  args.clientDir = npath.resolve(args.outputDir, args.clientDir || `${args.stage}/client`);

  return args;
};
