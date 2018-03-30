"use strict";

const moduleDir = require("@gourmet/module-dir")(__dirname);

class GourmetPluginWebpackReactHotLoader {
  _onWebpackPipelines(context) {
    return {
      js: [{
        loader: "#babel-loader",
        options: {
          plugins: context.stage === "hot" ? [{
            name: "react-hot-loader/babel",
            plugin: require.resolve("react-hot-loader/babel")
          }] : []
        }
      }]
    };
  }

  _onWebpackAlias() {
    return {
      "react-hot-loader": moduleDir("react-hot-loader")
    };
  }
}

GourmetPluginWebpackReactHotLoader.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:alias": proto._onWebpackAlias
  }))(GourmetPluginWebpackReactHotLoader.prototype)
};

module.exports = GourmetPluginWebpackReactHotLoader;
