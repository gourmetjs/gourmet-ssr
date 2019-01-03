"use strict";

const npath = require("path");

module.exports = function resolveDirs(args, obj={}) {
  obj.stage = args.stage || "local";
  obj.workDir = npath.resolve(process.cwd(), args.workDir || "");
  obj.outputDir = npath.resolve(obj.workDir, args.outputDir || ".gourmet");
  obj.serverDir = npath.resolve(obj.outputDir, args.serverDir || `${obj.stage}/server`);
  obj.clientDir = npath.resolve(obj.outputDir, args.clientDir || `${obj.stage}/client`);
  return obj;
};
