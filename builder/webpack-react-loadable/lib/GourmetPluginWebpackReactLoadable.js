"use strict";

class GourmetPluginWebpackReactLoadable {
  _onWebpackPipelines(context) {
    return {
      js: [{
        name: "#babel-loader",
        options: {
          plugins: [{
            name: "@gourmet/babel-plugin-gourmet-loadable",
            plugin: require.resolve("@gourmet/babel-plugin-gourmet-loadable"),
            options: {
              libraryName: "@gourmet/react-loadable",
              workDir: context.workDir,
              modules: context.target === "server"
            }
          }]
        }
      }]
    };
  }
}

GourmetPluginWebpackReactLoadable.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines
  }))(GourmetPluginWebpackReactLoadable.prototype)
};

module.exports = GourmetPluginWebpackReactLoadable;
