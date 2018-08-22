"use strict";

const parseArgs = require("@gourmet/parse-args");
const ServerImplBase = require("@gourmet/server-impl-base");
const express = require("express");

class ServerImplHttp extends ServerImplBase {
  constructor(options, args) {
    super(Object.assign({
      connect: express,
      serverUrl: "http://localhost:3939"
    }, options), args);
  }

  createClient() {
    const argv = this.argv;
    this.gourmet = require("@gourmet/client-http")({
      serverUrl: parseArgs.string(this.argv.serverUrl, this.options.serverUrl),
      entrypoint: parseArgs.string(argv.entrypoint, "main"),
      siloed: parseArgs.bool(argv.siloed),
      params: argv.params || {}
    });
  }

  installStaticServer() {
    // The client is already configured with the `serverUrl`.
    this.app.use(this.args.staticPrefix, this.gourmet.static());
  }
}

module.exports = ServerImplHttp;
