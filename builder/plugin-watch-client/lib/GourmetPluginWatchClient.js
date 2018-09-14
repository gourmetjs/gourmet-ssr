"use strict";

class PluginWatch {
  onEntry(value, context) {
    if (context.watch && context.target === "client") {
      return [
        "@gourmet/watch-client"
      ].concat(value);
    }
    return value;
  }

  onDefine(context) {
    if (context.watch && context.target === "client") {
      const options = context.argv;
      const port = options.watchPort || 3938;
      const host = options.watchHost || "localhost";
      const reconnect = options.watchReconnect;

      return {
        __GOURMET_WATCH_OPTIONS__: JSON.stringify({
          serverUrl: `ws://${host}:${port}`,
          reconnect
        })
      };
    }
  }
}

PluginWatch.meta = {
  hooks: {
    "build:entry": PluginWatch.prototype.onEntry,
    "build:define": PluginWatch.prototype.onDefine
  }
};

module.exports = PluginWatch;
