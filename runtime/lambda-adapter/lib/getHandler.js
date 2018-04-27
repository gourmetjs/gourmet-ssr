"use strict";

const npath = require("path");
const parseArgs = require("@gourmet/parse-args");
const clientLib = require("@gourmet/client-lib");

module.exports = function getHandler(args={}) {
  args.stage = process.env.GOURMET_STAGE || args.stage || "dev";
  args.workDir = npath.resolve(process.cwd(), args.workDir || "");
  args.outputDir = npath.resolve(args.workDir, args.outputDir || ".gourmet");
  args.serverDir = args.serverDir ? npath.resolve(args.workDir, args.serverDir) : npath.join(args.outputDir, args.stage, "server");
  args.clientDir = args.clientDir ? npath.resolve(args.workDir, args.clientDir) : npath.join(args.outputDir, args.stage, "client");
  args.entrypoint = process.env.GOURMET_ENTRYPOINT || args.entrypoint || "main";
  args.siloed = parseArgs.bool([process.env.GOURMET_SILOED, args.siloed]);

  const gourmet = clientLib(args);

  return function(event, context, callback) {
    gourmet.invoke(event, callback);
  };
};
