"use strict";

const npath = require("path");
const merge = require("@gourmet/merge");
const cliArgs = require("@gourmet/cli-args");

module.exports = function serverArgs(def, argv, options) {
  def = Object.assign({
    watch: false,
    stage: "local",
    workDir: "",
    serverDir: null,
    clientDir: null,
    port: process.env.PORT || 3000,
    host: process.env.HOST || "0.0.0.0"
  }, def);

  options = merge.intact({
    alias: {
      workDir: ["dir"],
      stage: ["s"]
    }
  }, options);

  const args = cliArgs(def, argv, options);

  args.workDir = npath.resolve(process.cwd(), args.workDir);
  args.serverDir = npath.resolve(args.workDir, args.serverDir || `.gourmet/${args.stage}/server`);
  args.clientDir = npath.resolve(args.workDir, args.clientDir || `.gourmet/${args.stage}/client`);

  return args;
};
