"use strict";

const npath = require("path");
const merge = require("@gourmet/merge");
const cliArgs = require("@gourmet/cli-args");

module.exports = function serverArgs(def, argv, options) {
  def = Object.assign({
    watch: false,
    stage: "local",
    workDir: "",
    outputDir: ".gourmet",
    serverDir: null,
    clientDir: null,
    staticPrefix: "/s/",
    port: 3000
  }, def);

  options = merge.intact({
    alias: {
      workDir: ["dir", "d"],
      stage: ["s"]
    }
  }, options);

  const args = cliArgs(def, argv, options);

  args.workDir = npath.resolve(process.cwd(), args.workDir);
  args.outputDir = npath.resolve(args.workDir, args.outputDir);
  args.serverDir = npath.resolve(args.workDir, args.serverDir || `${args.outputDir}/${args.stage}/server`);
  args.clientDir = npath.resolve(args.workDir, args.clientDir || `${args.outputDir}/${args.stage}/client`);

  return args;
};
