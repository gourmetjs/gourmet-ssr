"use strict";

class GourmetPluginSourceMapSupport {
  onInit(context) {
    return context.vars.get("builder.installSourceMapSupport", true).then(value => {
      this._installSourceMapSupport = value;
    });
  }

  onAlias(context) {
    if (this._installSourceMapSupport) {
      const moduleDir = context.builder.moduleDir(__dirname);
      return {
        "source-map-support": moduleDir("source-map-support")
      };
    }
  }

  onEntry(value, context) {
    if (this._installSourceMapSupport && context.target === "server" && context.sourceMap) {
      return [
        require.resolve("../src/install.js")
      ].concat(value);
    }
    return value;
  }
}

GourmetPluginSourceMapSupport.meta = {
  hooks: {
    "build:init": GourmetPluginSourceMapSupport.prototype.onInit,
    "build:alias": GourmetPluginSourceMapSupport.prototype.onAlias,
    "build:entry": GourmetPluginSourceMapSupport.prototype.onEntry
  }
};

module.exports = GourmetPluginSourceMapSupport;
