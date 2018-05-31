"use strict";

class GourmetPluginReactLoadable {
  _onWebpackPipelines(context) {
    return {
      js: [{
        name: "#babel-loader",
        options: {
          plugins: [{
            name: "@gourmet/babel-plugin-gourmet-loadable",
            plugin: require.resolve("@gourmet/babel-plugin-gourmet-loadable")
          }]
        }
      }]
    };
  }

  _onWebpackLoaders() {
    return {
      blob: {
        extensions: "*",  // this will match all non-registered extensions
        select: {
          blob: {
            order: 9999,
            pipeline: "blob"
          }
        }
      }
    };
  }
}

GourmetPluginReactLoadable.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:loaders": proto._onWebpackLoaders
  }))(GourmetPluginReactLoadable.prototype)
};

module.exports = GourmetPluginReactLoadable;
