"use strict";

class GourmetPluginSourceMapSupport {
  onAlias(context) {
    if (context.config.builder.installSourceMapSupport) {
      const moduleDir = context.builder.moduleDir(__dirname);
      return {
        "source-map-support": moduleDir("source-map-support")
      };
    }
  }

  onEntry(value, context) {
    const v = context.config.builder;
    if (context.target === "server" && v.installSourceMapSupport && v.sourceMap) {
      return [
        require.resolve("../src/install.js")
      ].concat(value);
    }
    return value;
  }
}

GourmetPluginSourceMapSupport.meta = {
  hooks: {
    "build:alias": GourmetPluginSourceMapSupport.prototype.onAlias,
    "build:entry": GourmetPluginSourceMapSupport.prototype.onEntry
  }
};

module.exports = GourmetPluginSourceMapSupport;
