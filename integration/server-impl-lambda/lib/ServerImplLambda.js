"use strict";

const parseArgs = require("@gourmet/parse-args");
const ServerImplBase = require("@gourmet/server-impl-base");
const express = require("express");

class ServerImplLambda extends ServerImplBase {
  constructor(options, args) {
    super(Object.assign({
      connect: express,
      enableStatic: false,
      functionName: undefined,
      qualifier: undefined
    }, options), args);
  }

  createClient() {
    const argv = this.argv;
    this.gourmet = require("@gourmet/client-lambda")({
      functionName: parseArgs.string([this.argv.functionName, this.options.functionName], parseArgs.undef),
      qualifier: parseArgs.string([this.argv.qualifier, this.options.qualifier], parseArgs.undef),
      entrypoint: parseArgs.string(argv.entrypoint, "main"),
      siloed: parseArgs.bool(argv.siloed),
      params: argv.params || {}
    });
  }
}

module.exports = ServerImplLambda;
