"use strict";

class GourmetPluginWebpackDevServer {
  _onDevServerCommand() {
    
  }
}

GourmetPluginWebpackDevServer.meta = {
  commands: {
    "dev-server": {
      help: "Run the development server",
      options: {
        stage: {
          help: "Specify the stage (e.g. '--stage prod')",
          short: "s"
        }
        // Supports the same options as 'build' command
      }
    }
  },
  hooks: (proto => ({
    "command:dev-server": proto._onDevServerCommand
  }))(GourmetPluginWebpackDevServer.prototype)
};

module.exports = GourmetPluginWebpackDevServer;
