"use strict";

class PluginReactEmotion {
  onPipelines(context) {
    return {
      js: [{
        loader: "#babel-loader",
        options: {
          plugins: [{
            name: "babel-plugin-emotion",
            plugin: require.resolve("babel-plugin-emotion"),
            options: {
              hoist: context.optimize,
              sourceMap: context.sourceMap,
              autoLabel: context.debug
            }
          }]
        }
      }]
    };
  }

  onEntryInit({target}) {
    if (target === "server") {
      return {
        renderer: [
          "@gourmet/emotion-renderer/server"
        ]
      };
    }
  }
}

PluginReactEmotion.meta = {
  schema: {
    after: "@gourmet/plugin-react"
  },
  hooks: {
    "build:webpack:pipelines": PluginReactEmotion.prototype.onPipelines,
    "build:webpack:entry_init": PluginReactEmotion.prototype.onEntryInit
  }
};

module.exports = PluginReactEmotion;
