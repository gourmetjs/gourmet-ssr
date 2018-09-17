"use strict";

const WebpackPluginPreserveInjector = require("./WebpackPluginPreserveInjector");

class GourmetPluginPreserveInjector {
  onPlugins(context) {
    // `@gourmet/renderer-sandbox` is used only for the server rendering.
    if (context.target === "server") {
      return {
        plugins: [{
          name: "@gourmet/webpack-preserve-injector",
          plugin: WebpackPluginPreserveInjector
        }]
      };
    }
  }
}

GourmetPluginPreserveInjector.meta = {
  hooks: {
    "build:plugins": GourmetPluginPreserveInjector.prototype.onPlugins
  }
};

module.exports = GourmetPluginPreserveInjector;
