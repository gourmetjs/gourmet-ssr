"use strict";

class PluginReactHotLoader {
  onPipelines(context) {
    if (context.target === "client" && context.watch === "hot") {
      return {
        js: [{
          loader: "#babel-loader",
          options: {
            plugins: [{
              name: "react-hot-loader/babel",
              plugin: require.resolve("react-hot-loader/babel")
            }]
          }
        }]
      };
    }
  }
}

PluginReactHotLoader.meta = {
  hooks: {
    "build:webpack:pipelines": PluginReactHotLoader.prototype.onPipelines
  }
};

module.exports = PluginReactHotLoader;
