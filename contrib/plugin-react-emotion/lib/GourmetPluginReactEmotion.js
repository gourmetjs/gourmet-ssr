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
              hoist: context.minify,
              sourceMap: context.sourceMap,
              autoLabel: context.debug
            }
          }]
        }
      }]
    };
  }

  onPageRenderer({target}) {
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
    "build:pipelines": PluginReactEmotion.prototype.onPipelines,
    "build:page_renderer": PluginReactEmotion.prototype.onPageRenderer
  }
};

module.exports = PluginReactEmotion;
