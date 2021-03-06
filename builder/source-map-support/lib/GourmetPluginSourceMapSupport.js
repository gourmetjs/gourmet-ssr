"use strict";

class GourmetPluginSourceMapSupport {
  async onUserConfig(context) {
    if (await context.vars.get("builder.installSourceMapSupport")) {
      const moduleDir = context.builder.moduleDir(__dirname);
      return {
        builder: {
          alias: {
            "gmint-source-map-support": moduleDir("source-map-support")
          }
        }
      };
    }
  }

  onEntry(value, context) {
    const config = context.config.builder;
    if (context.target === "server" && config.installSourceMapSupport && config.sourceMap) {
      return [
        require.resolve("../gmsrc/install.js")
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
