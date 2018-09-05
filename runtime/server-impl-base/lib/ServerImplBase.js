"use strict";

const http = require("http");
const morgan = require("morgan");
const serveStatic = require("serve-static");
const getConsole = require("@gourmet/console");
const detect = require("@gourmet/console-env");
const serverArgs = require("@gourmet/server-args");
const parseArgs = require("@gourmet/parse-args");
const error = require("@gourmet/error");
const NOT_IMPLEMENTED = require("@gourmet/error/NOT_IMPLEMENTED");
const handleRequestError = require("@gourmet/handle-request-error");

let con;

class ServerImplBase {
  constructor(options, args) {
    this.options = Object.assign({
      connect: null,
      defaultPort: 3000,
      defaultHost: "0.0.0.0",
      enableLogger: true,
      enableStatic: true
    }, options);

    this.connect = this.options.connect;

    if (!this.connect)
      throw Error("'connect' option is required");

    this.args = this.parseArgs(args);
    this.argv = this.args.argv;

    con = this.initConsole();
  }

  parseArgs(args) {
    if (!args)
      return serverArgs(process.argv.slice(2));
    else
      return args;
  }

  initConsole() {
    getConsole.install(detect({
      useColors: parseArgs.bool(this.argv.colors, parseArgs.undef),
      minLevel: parseArgs.verbosity([this.argv.verbose, this.argv.v])
    }));
    return getConsole("gourmet:net");
  }

  start() {
    this.createApp();
    this.createHttpServer();
    this.createClient();
    this.installInitialMiddleware();
    this.installMiddleware();
    this.installFinalMiddleware();
    this.listen();
  }

  createApp() {
    this.app = this.connect();
  }

  createHttpServer() {
    this.httpServer = http.createServer(this.app);
  }

  createClient() {
    throw error(NOT_IMPLEMENTED);
  }

  installInitialMiddleware() {
    if (this.options.enableLogger)
      this.installLogger();
    if (this.options.enableStatic)
      this.installStaticServer();
  }

  installMiddleware() {
    this.installRenderer();
  }

  installFinalMiddleware() {
    this.installErrorHandler();
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
    this.app.use(this.args.staticPrefix, serveStatic(this.args.clientDir, {
      fallthrough: false,
      index: false,
      redirect: false
    }));
  }

  installRenderer() {
    const mount = parseArgs.string(this.argv.mount, "/");
    this.app.use(mount, (req, res, next) => {
      const args = this.getRenderArgs(req);
      this.gourmet.render(req, res, next, args);
    });
  }

  installErrorHandler() {
    const options = this.getErrorHandlerOptions();
    this.app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
      handleRequestError(err, req, res, options);
    });
  }

  listen() {
    const port = parseArgs.number([this.argv.port, process.env.PORT], this.options.defaultPort);
    const host = parseArgs.string([this.argv.host, process.env.HOST], this.options.defaultHost);
    this.httpServer.listen(port, host, () => {
      con.log(`Server is listening on port ${this.httpServer.address().port}`);
    });
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

  getRenderArgs(req) {  // eslint-disable-line no-unused-vars
  }

  getErrorHandlerOptions() {
    return {
      console: con,
      debug: parseArgs.bool(this.argv.debug, process.env.NODE_ENV !== "production")
    };
  }
}

module.exports = ServerImplBase;