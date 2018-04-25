"use strict";

const parseArgs = require("@gourmet/parse-args");
const ServerImplBase = require("@gourmet/server-impl-base");
const express = require("express");

class ServerImplLib extends ServerImplBase {
  constructor(args) {
    super(args, express);
  }

  createClient() {
    const argv = this.argv;
    this.gourmet = require("@gourmet/client-lib")({
      serverDir: this.args.serverDir,
      entrypoint: parseArgs.string(argv.entrypoint, "main"),
      siloed: parseArgs.bool(argv.siloed),
      params: argv.params || {}
    });
  }

  installInitialMiddleware() {
    super.installInitialMiddleware();
    this.installStaticServer();
  }

  installStaticServer() {
    const staticPrefix = parseArgs.string(this.argv.staticPrefix, "/s/");
    this.app.use(staticPrefix, this.gourmet.static(this.args));
  }
}

module.exports = ServerImplLib;
