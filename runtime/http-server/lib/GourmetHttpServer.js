"use strict";

const connect = require("connect");
const getConsole = require("@gourmet/console");
const parseArgs = require("@gourmet/parse-args");
const ServerImplBase = require("@gourmet/server-impl-base");

class GourmetHttpServer extends ServerImplBase {
  constructor(options, args) {
    super(Object.assign({
      connect,
      defaultPort: 3939
    }, options), args);
  }

  initConsole() {
    return getConsole("gourmet:net");
  }

  createClient() {
    const argv = this.argv;
    this.gourmet = require("@gourmet/client-lib")({
      serverDir: this.args.serverDir,
      page: parseArgs.string(argv.page, "main"),
      siloed: parseArgs.bool(argv.siloed),
      params: argv.params || {}
    });
  }

  installStaticServer() {
    const enableStatic = parseArgs.bool(this.argv.static, true);
    if (enableStatic)
      super.installStaticServer();
  }

  getRenderArgs(req) {
    const args = req.headers["x-gourmet-args"];
    if (args) {
      try {
        const buf = Buffer.from(args, "base64");
        req.gourmet = JSON.parse(buf.toString());
      } catch (err) {
        req.gourmet = {};
      }
    } else {
      req.gourmet = {};
    }
    return req.gourmet;
  }

  getErrorHandlerOptions() {
    const options = super.getErrorHandlerOptions();
    options.requestProps = ["url", "method", "headers", "gourmet"];
    return options;
  }
}

module.exports = GourmetHttpServer;
