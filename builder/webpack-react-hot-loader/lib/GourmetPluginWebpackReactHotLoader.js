"use strict";

class GourmetPluginWebpackReactHotLoader {
  _onWebpackPipelines(context) {
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

  _onWebpackAlias(context) {
    if (context.watch === "hot") {
      return {
        "react-hot-loader": context.builder.moduleDir(__dirname)("react-hot-loader")
      };
    }
  }
}

GourmetPluginWebpackReactHotLoader.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:alias": proto._onWebpackAlias
  }))(GourmetPluginWebpackReactHotLoader.prototype)
};

module.exports = GourmetPluginWebpackReactHotLoader;
