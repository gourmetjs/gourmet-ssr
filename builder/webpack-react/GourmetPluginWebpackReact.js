"use strict";

class GourmetPluginWebpackReact {
  constructor() {
    this.plugin = {
      name: "gourmet-plugin-webpack-react",
      hooks: {
        "build:webpack:loaders": this._onWebpackLoaders,
        "build:webpack:config": this._onWebpackConfig
      }
    };
  }

  _onWebpackLoaders() {
    return {
      js: {
        extensions: ["jsx"],
        // Adds "babel-preset-react" to `options.presets` of `babel-loader`.
        pipelines: {
          default: {
            use: [{
              loader: "babel-loader",
              options: {
                presets: [{
                  name: "babel-preset-react",
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

module.exports = GourmetPluginWebpackReact;
