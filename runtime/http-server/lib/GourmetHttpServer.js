"use strict";

const http = require("http");
const morgan = require("morgan");
const connect = require("connect");
const serveStatic = require("serve-static");
const con = require("@gourmet/console")("gourmet:net");
const parseArgs = require("@gourmet/parse-args");
const handleRequestError = require("@gourmet/handle-request-error");

class GourmetHttpServer {
  constructor(options={}) {
    this.options = options;
    this.argv = options.argv;
    this.serverDir = options.serverDir;
    this.clientDir = options.clientDir;
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
      this.app.use(staticPrefix, serveStatic(this.clientDir, {
        fallthrough: false,
        index: false,
        redirect: false
      }));
    }
  }

  installArgsParser() {
    this.app.use((req, res, next) => {
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
      next();
    });
  }

  installRenderer() {
    const mount = parseArgs.string(this.argv.mount, "/");
    this.app.use(mount, (req, res, next) => {
      this.gourmet.render(req, res, next, req.gourmet);
    });
  }

  installErrorHandler() {
    this.app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
      handleRequestError(err, req, res, {
        console: con,
        debug: parseArgs.bool(this.argv.debug, true),
        requestProps: ["url", "method", "headers", "gourmet"]
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
    this.app = connect();
  }

  createHttpServer() {
    this.httpServer = http.createServer(this.app);
  }

  installInitialMiddleware() {
    this.installLogger();
    this.installStaticServer();
  }

  installMiddleware() {
    this.installArgsParser();
    this.installRenderer();
  }

  installFinalMiddleware() {
    this.installErrorHandler();
  }

  listen() {
    const port = parseArgs.number(this.argv.port, 3939);
    const host = parseArgs.string(this.argv.host, "0.0.0.0");
    this.httpServer.listen(port, host);
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

  close() {
    this.httpServer.close();
  }
}

module.exports = GourmetHttpServer;
