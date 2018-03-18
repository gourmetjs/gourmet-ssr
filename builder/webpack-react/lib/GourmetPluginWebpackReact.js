"use strict";

class GourmetPluginWebpackReact {
  _onWebpackLoaders() {
    return {
      js: {
        extensions: ["jsx"],
        // Adds "babel-preset-react" to `options.presets` of `babel-loader`.
        pipelines: {
          default: {
            use: [{
              loader: "#babel-loader",
              options: {
                presets: [{
                  name: "babel-preset-react",
                  plugin: require.resolve("babel-preset-react"),
                  after: "babel-preset-env"
                }]
              }
            }]
          }
        }
      }
    };
  }

  _onWebpackConfig() {
    // Appends `.jsx` to `resolve.extensions` so that `.jsx` can be omitted
    // in `require` or `import`.
    return {
      resolve: {
        extensions: [".jsx"]
      }
    };
  }
}

GourmetPluginWebpackReact.meta = {
  hooks: (proto => ({
    "build:webpack:loaders": proto._onWebpackLoaders,
    "build:webpack:config": proto._onWebpackConfig
  }))(GourmetPluginWebpackReact.prototype)
};

module.exports = GourmetPluginWebpackReact;
