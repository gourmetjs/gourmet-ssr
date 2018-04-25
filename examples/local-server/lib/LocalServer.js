"use strict";

const http = require("http");
const morgan = require("morgan");
const express = require("express");
const getConsole = require("@gourmet/console");
const detect = require("@gourmet/console-env");
const parseArgs = require("@gourmet/parse-args");
const handleRequestError = require("@gourmet/handle-request-error");

let con;

class LocalServer {
  constructor(options={}) {
    this.options = options;
    this.argv = options.argv;
    this.serverDir = options.serverDir;
    this.clientDir = options.clientDir;
    this.initConsole();
  }

  initConsole() {
    getConsole.install(detect({
      useColors: parseArgs.bool(this.argv.colors, parseArgs.undef),
      minLevel: parseArgs.verbosity([this.argv.verbose, this.argv.v])
    }));
    con = getConsole("gourmet:net");
  }

  installLogger() {
    const format = parseArgs.string(this.argv.logFormat, "dev");
    if (format !== "off") {
      this.app.use(morgan(format, {
        // Currently, morgan just use 'write' method of the output stream so
        // we can easily redirect output to our own console.
        stream: {
          write(text) {
            if (text.substr(-1) === "\n")
              text = text.substr(0, text.length - 1);
            con.log(text);
          }
        }
      }));
    }
  }

  installStaticServer() {
    const enableStatic = parseArgs.bool(this.argv.static, true);
    if (enableStatic) {
      const staticPrefix = parseArgs.string(this.argv.staticPrefix, "/s/");
      this.app.use(staticPrefix, express.static(this.clientDir, {
        fallthrough: false,
        index: false,
        redirect: false
      }));
    }
  }

  installErrorHandler() {
    this.app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
      handleRequestError(err, req, res, {
        console: con,
        debug: parseArgs.bool(this.argv.debug, true)
      });
    });
  }

  createClientLib() {
    const argv = this.argv;
    this.gourmet = require("@gourmet/client-lib")({
      serverDir: this.serverDir,
      entrypoint: parseArgs.string(argv.entrypoint, "main"),
      siloed: parseArgs.bool(argv.siloed),
      params: argv.params || {}
    });
  }

  createApp() {
    this.app = express();
  }

  createHttpServer() {
    this.httpServer = http.createServer(this.app);
  }

  installInitialMiddleware() {
    this.installLogger();
    this.installStaticServer();
  }

  installMiddleware() {
  }

  installFinalMiddleware() {
    this.installErrorHandler();
  }

  listen() {
    const port = parseArgs.number(this.argv.port, 3000);
    const host = parseArgs.string(this.argv.host, "0.0.0.0");
    this.httpServer.listen(port, host, () => {
      con.log(`Server is listening on port ${this.httpServer.address().port}`);
    });
  }

  start() {
    this.createApp();
    this.createHttpServer();
    this.createClientLib();
    this.installInitialMiddleware();
    this.installMiddleware();
    this.installFinalMiddleware();
    this.listen();
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.httpServer.once("error", reject);
      this.httpServer.once("listening", () => {
        resolve(this.httpServer.address().port);
      });
    });
  }

  close() {
    this.httpServer.close();
  }
}

module.exports = LocalServer;
