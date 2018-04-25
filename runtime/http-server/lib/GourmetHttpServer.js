"use strict";

const connect = require("connect");
const getConsole = require("@gourmet/console");
const parseArgs = require("@gourmet/parse-args");
const ServerImplBase = require("@gourmet/server-impl-base");

class GourmetHttpServer extends ServerImplBase {
  constructor(args) {
    super(args, connect);
  }

  initConsole() {
    return getConsole("gourmet:net");
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
    this.installLogger();
    this.installStaticServer();
  }

  installStaticServer() {
    const enableStatic = parseArgs.bool(this.argv.static, true);
    if (enableStatic) {
      const staticPrefix = parseArgs.string(this.argv.staticPrefix, "/s/");
      this.app.use(staticPrefix, this.gourmet.static(this.args));
    }
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

  getDefaultPort() {
    return 3939;
  }
}

module.exports = GourmetHttpServer;
