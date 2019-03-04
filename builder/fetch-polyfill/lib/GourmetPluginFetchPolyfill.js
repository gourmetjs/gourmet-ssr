"use strict";

class GourmetPluginFetchPolyfill {
  async onUserConfig(context) {
    if (await context.vars.get("builder.installFetchPolyfill")) {
      const moduleDir = context.builder.moduleDir(__dirname);
      return {
        builder: {
          alias: {
            "gmint-whatwg-fetch": moduleDir("whatwg-fetch")
          }
        }
      };
    }
  }

  onEntry(value, context) {
    const config = context.config.builder;
    if (context.target === "client" && config.installFetchPolyfill) {
      return [
        require.resolve("../gmsrc/install.js")
      ].concat(value);
    }
    return value;
  }
}

GourmetPluginFetchPolyfill.meta = {
  hooks: {
    "build:user_config": GourmetPluginFetchPolyfill.prototype.onUserConfig,
    "build:entry": GourmetPluginFetchPolyfill.prototype.onEntry
  }
};

module.exports = GourmetPluginFetchPolyfill;
