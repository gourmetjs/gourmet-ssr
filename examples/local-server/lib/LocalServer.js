"use strict";

const http = require("http");
const morgan = require("morgan");
const express = require("express");
const serveStatic = require("serve-static");
const con = require("@gourmet/console")("gourmet:net");
const parseArgs = require("@gourmet/parse-args");
const handleRequestError = require("@gourmet/handle-request-error");

class LocalServer {
  constructor(options={}) {
    this.options = options;
    this.argv = options.argv;
    this.serverDir = options.serverDir;
    this.clientDir = options.clientDir;
  }

  installLogger() {
    const format = this.argv.logFormat || "dev";
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
    if (this.argv.static === undefined || this.argv.static) {
      const staticPrefix = this.argv.staticPrefix || "/s/";
      this.app.use(staticPrefix, serveStatic(this.clientDir, {
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
        debug: this.argv.debug === undefined ? true : this.argv.debug,
        requestProps: ["url", "method", "headers", "gourmet"]
      });
    });
  }

  createClientLib() {
    const argv = this.argv;
    this.gourmet = require("@gourmet/client-lib")({
      serverDir: this.serverDir,
      entrypoint: argv.entrypoint || "main",
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
    const argv = this.argv;
    const port = argv.port;
    const host = argv.host;
    this.httpServer.listen(port === undefined ? 3000 : port, host === undefined ? "0.0.0.0" : host, () => {
      if (argv.logFormat !== "off")
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
