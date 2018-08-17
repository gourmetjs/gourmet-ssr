"use strict";

class PluginReactHotLoader {
  onPipelines(context) {
    return {
      js: [{
        loader: "#babel-loader",
        options: {
          plugins: context.target === "client" && context.watch === "hot" ? [{
            name: "react-hot-loader/babel",
            plugin: require.resolve("react-hot-loader/babel")
          }] : []
        }
      }]
    };
  }
}

PluginReactHotLoader.meta = {
  hooks: {
    "build:webpack:pipelines": PluginReactHotLoader.prototype.onPipelines
  }
};

module.exports = PluginReactHotLoader;
