"use strict";

class GourmetPluginWebpackDevServer {
  _onCommand(context) {
    // We defer the calls to `require` to the point where 'hot' or 'watch' command is
    // actually executed to minimize the impact on startup time of 'gourmet'
    // CLI. All plugins are loaded and instantiated at startup.
    const con = context.console;

    con.info(`GourmetDevServer: executing '${context.command}' command...`);

    const DevHttpServer = require("./DevHttpServer");
    const serverArgs = require("@gourmet/server-args");
    const {serverDir, clientDir} = serverArgs.parse(context.argv);

    return new Promise(() => {
      const server = new DevHttpServer(null, {
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
      help: "Run a HTTP server in the Hot Module Replacement mode for development"
    },
    "watch": {
      help: "Run a HTTP server in the watch mode (automatically monitoring file changes) for development"
    }
  },
  hooks: (proto => ({
    "command:hot": proto._onCommand,
    "command:watch": proto._onCommand
  }))(GourmetPluginWebpackDevServer.prototype)
};

module.exports = GourmetPluginWebpackDevServer;
