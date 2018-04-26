"use strict";

const parseArgs = require("@gourmet/parse-args");
const ServerImplBase = require("@gourmet/server-impl-base");
const express = require("express");

class ServerImplHttp extends ServerImplBase {
  constructor(args) {
    super(args, express);
    this.serverUrl = parseArgs.string([this.argv.serverUrl, this.args.serverUrl], parseArgs.undef);
  }

  createClient() {
    const argv = this.argv;
    this.gourmet = require("@gourmet/client-http")({
      serverUrl: this.serverUrl,
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
    this.app.use(staticPrefix, this.gourmet.static({serverUrl: this.serverUrl}));
  }
}

module.exports = ServerImplHttp;
