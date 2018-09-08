"use strict";

let con;

class GourmetHttpServer {
  constructor(options) {
    this.options = Object.assign({
      page: "main",
      logFormat: "dev",
      port: 3939,
      host: "0.0.0.0",
      static: true
    }, options);

    con = this.initConsole();
  }

  initConsole() {
    const getConsole = require("@gourmet/console");
    return getConsole("gourmet:net");
  }

  start() {
    this.createConnect();
    this.createApp();
    this.createHttpServer();
    this.createClient();
    this.installInitialMiddleware();
    this.installMiddleware();
    this.installFinalMiddleware();
    this.listen();
  }

  createConnect() {
    this.connect = require("connect");
  }

  createApp() {
    this.app = this.connect();
  }

  createHttpServer() {
    const http = require("http");
    this.httpServer = http.createServer(this.app);
  }

  createClient() {
    this.gourmet = require("@gourmet/client-lib");
  }

  installInitialMiddleware() {
    this.installLogger();
    this.installGourmetMiddleware();
  }

  installMiddleware() {
    this.installRenderer();
  }

  installFinalMiddleware() {
    this.installErrorHandler();
  }

  installLogger() {
    const format = this.options.lotFormat;
    if (format !== "off") {
      const morgan = require("morgan");
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

  installGourmetMiddleware() {
    this.app.use(this.gourmet.middleware(this.options));
  }

  installRenderer() {
    this.app.use((req, res) => {
      const context = this.getRenderContext(req);
      const page = context.page || this.options.page;
      res.serve(page, null, context);
    });
  }

  getRenderContext(req) {
    const context = req.headers["x-gourmet-context"];
    if (context) {
      try {
        const buf = Buffer.from(context, "base64");
        return JSON.parse(buf.toString());
      } catch (err) {
        // silently ignore parsing error
      }
    }
    return {};
  }

  installErrorHandler() {
    const errorMiddleware = require("@gourmet/error-middleware");
    const options = this.getErrorHandlerOptions();
    this.app.use(errorMiddleware(options));
  }

  listen() {
    this.httpServer.listen(this.options.port, this.options.host, () => {
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

  getErrorHandlerOptions() {
    return {
      console: con,
      debug: this.options.debug,
      requestProps: ["url", "method", "headers", "gourmet"]
    };
  }
}

module.exports = GourmetHttpServer;
