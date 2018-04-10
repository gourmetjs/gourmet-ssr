"use strict";

class GourmetPluginReactEmotion {
  _onWebpackPipelines(context) {
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
}

GourmetPluginReactEmotion.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines
  }))(GourmetPluginReactEmotion.prototype)
};

module.exports = GourmetPluginReactEmotion;
