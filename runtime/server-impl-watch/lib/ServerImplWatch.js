"use strict";

const ServerImplLib = require("@gourmet/server-impl-lib");
const gourmetWatch = require("@gourmet/watch-middleware");

class ServerImplWatch extends ServerImplLib {
  installInitialMiddleware() {
    super.installInitialMiddleware();
    this.installWatcher();
  }

  installStaticServer() {
    if (!this.args.watch)
      super.installStaticServer();
  }

  installWatcher() {
    if (this.args.watch)
      this.app.use(gourmetWatch(this.args, this.gourmet));
  }
}

module.exports = ServerImplWatch;
