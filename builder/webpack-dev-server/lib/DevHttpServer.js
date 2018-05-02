"use strict";

const GourmetHttpServer = require("@gourmet/http-server");

class DevHttpServer extends GourmetHttpServer {
  installWatcher() {
    const watch = require("@gourmet/watch-middleware")({
      watch: this.args.watch,
      argv: this.argv
    }, this.gourmet);
    this.app.use(watch);
  }

  installInitialMiddleware() {
    this.installLogger();
    this.installWatcher();  // replace `installStaticServer()` with `installWatcher()`
  }
}

module.exports = DevHttpServer;
