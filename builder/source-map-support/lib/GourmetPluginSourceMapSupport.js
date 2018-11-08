"use strict";

class GourmetPluginSourceMapSupport {
  onUserConfig(context) {
    if (context.config.builder.installSourceMapSupport) {
      const moduleDir = context.builder.moduleDir(__dirname);
      return {
        builder: {
          alias: {
            "source-map-support": moduleDir("source-map-support")
          }
        }
      };
    }
  }

  onEntry(value, context) {
    const config = context.config.builder;
    if (context.target === "server" && config.installSourceMapSupport && config.sourceMap) {
      return [
        require.resolve("../gourmet-source/install.js")
      ].concat(value);
    }
    return value;
  }
}

GourmetPluginSourceMapSupport.meta = {
  hooks: {
    "build:user_config": GourmetPluginSourceMapSupport.prototype.onUserConfig,
    "build:entry": GourmetPluginSourceMapSupport.prototype.onEntry
  }
};

module.exports = GourmetPluginSourceMapSupport;
