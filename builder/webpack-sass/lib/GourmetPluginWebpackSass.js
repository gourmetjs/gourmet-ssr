"use strict";

class GourmetPluginWebpackSass {
  constructor() {
    this.plugin = {
      name: "gourmet-plugin-webpack-sass",
      hooks: {
        "build:webpack:loaders": this._onWebpackLoaders
      }
    };
  }

  _onWebpackLoaders(build) {
    return {
      sass: {
        extensions: ["sass", "scss"],
        pipelines: {
          vendor: {
            test: [build.getVendorDirTester()],
            use: [{
              pipeline: "css.vendor"
            }, {
              // https://github.com/webpack-contrib/sass-loader#problems-with-url
              loader: "resolve-url-loader"
            }, {
              loader: "sass-loader",
              options: {sourceMap: true}
            }]
          },
          default: {
            use: [{
              pipeline: "css.default"
            }, {
              loader: "resolve-url-loader"
            }, {
              loader: "sass-loader",
              options: {sourceMap: true}
            }]
          },
          css_modules: {
            test: [],
            use: [{
              pipeline: "css.css_modules"
            }, {
              loader: "resolve-url-loader"
            }, {
              loader: "sass-loader",
              options: {sourceMap: true}
            }]
          }
        }
      }
    };
  }
}

module.exports = GourmetPluginWebpackSass;
