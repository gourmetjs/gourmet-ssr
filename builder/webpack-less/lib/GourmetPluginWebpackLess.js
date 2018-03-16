"use strict";

class GourmetPluginWebpackLess {
  constructor() {
    this.plugin = {
      name: "gourmet-plugin-webpack-less",
      hooks: {
        "build:webpack:loaders": this._onWebpackLoaders
      }
    };
  }

  _onWebpackLoaders(build) {
    return {
      less: {
        extensions: ["less"],
        pipelines: {
          vendor: {
            test: [build.getVendorDirTester()],
            use: [{
              pipeline: "css.vendor"
            }, {
              loader: "less-loader",
              options: {}
            }]
          },
          default: {
            use: [{
              pipeline: "css.default"
            }, {
              loader: "less-loader",
              options: {}
            }]
          },
          css_modules: {
            test: [],
            use: [{
              pipeline: "css.css_modules"
            }, {
              loader: "less-loader",
              options: {}
            }]
          }
        }
      }
    };
  }
}

module.exports = GourmetPluginWebpackLess;
