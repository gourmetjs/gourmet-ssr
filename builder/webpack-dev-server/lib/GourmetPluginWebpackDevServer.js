"use strict";

const GourmetHttpServer = require("@gourmet/http-server/lib/GourmetHttpServer");

class DevHttpServer extends GourmetHttpServer {
  installWatcher() {
    const gourmet = this._clientLib = require("@gourmet/client-lib")();
    const watch = require("@gourmet/watch-middleware")({
      watch: this.watch,
      argv: this.argv
    }, gourmet);
    this.use(watch);
  }

  installInitialMiddleware() {
    this.installLogger();
    this.installWatcher();
  }

  getClientLib() {
    return this._clientLib;
  }
}

class GourmetPluginWebpackDevServer {
  _onCommand(context) {
    context.console.info(`GourmetDevServer: executing '${context.command}' command...`);

    const serverArgs = require("@gourmet/server-args");
    const {serverDir, clientDir} = serverArgs.parse(context.argv);

    return new Promise(() => {
      const server = new DevHttpServer({
        watch: context.command === "hot" ? "hot" : true,
        argv: context.argv,
        serverDir,
        clientDir
      });
      server.start();
    });
  }
}

GourmetPluginWebpackDevServer.meta = {
  commands: {
    "hot": {
      help: "Run a standalone HTTP development server - HMR mode",
    },
    "watch": {
      help: "Run a standalone HTTP development server - watch mode"
    }
  },
  hooks: (proto => ({
    "command:hot": proto._onCommand,
    "command:watch": proto._onCommand
  }))(GourmetPluginWebpackDevServer.prototype)
};

module.exports = GourmetPluginWebpackDevServer;
