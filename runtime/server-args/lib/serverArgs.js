"use strict";

const merge = require("@gourmet/merge");
const cliArgs = require("@gourmet/cli-args");
const resolveDirs = require("@gourmet/resolve-dirs");

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

  return resolveDirs(args, args);
};
