"use strict";

const resolvePostCssPlugins = require("@gourmet/resolve-postcss-plugins");

class GourmetPluginWebpackCss {
  constructor() {
    this.plugin = {
      name: "gourmet-plugin-webpack-css",
      hooks: {
        "build:webpack:loaders": this._onWebpackLoaders,
        "build:webpack:loader_options": this._onLoaderOptions
      }
    };
  }

  _onWebpackPipelines() {
    return {
      pipelines: {
        css: [{
          loader: "css-loader",
          options: {
            // If you set `importLoaders` to 0, imported CSS files (`@import`) will not
            // be processed by `postcss-loader` which results in bypassing `autoprefixed`.
            // This is not a desirable behavior in default setup but you may see other
            // side effects if you use other PostCSS plugins. This is a tricky issue.
            importLoaders: 1
          }
        }, {
          loader: "postcss-loader",
          options: {
            plugins: [
              // Autoprefixer uses `browserslist` and putting options under `browserslist`
              // key of `package.json` is recommended way of configuring it as opposed to
              // specifying options here.
              "autoprefixer"
            ]
          }
        }],
        css_modules: [{
          pipeline: "css"
        }, {
          loader: "#css-loader",
          options: {
            modules: true
          }
        }]
      }
    };
  }

  _onWebpackLoaders({build}) {
    return {
      test: 
    };
  }

      rules: {}

      css: {
        extensions: ["css"],
        pipelines: {
          vendor: {
            test: [build.getVendorDirTester()],
            use: [{
              loader: "css-loader"
            }]
          },
          default: {
            use: [{
              loader: "css-loader",
              options: {
                // If you set `importLoaders` to 0, imported CSS files (`@import`) will not
                // be processed by `postcss-loader` which results in bypassing `autoprefixed`.
                // This is not a desirable behavior in default setup but you may see other
                // side effects if you use other PostCSS plugins. This is a tricky issue.
                importLoaders: 1
              }
            }, {
              loader: "postcss-loader",
              options: {
                plugins: [
                  // Autoprefixer uses `browserslist` and putting options under `browserslist`
                  // key of `package.json` is recommended way of configuring it as opposed to
                  // specifying options here.
                  "autoprefixer"
                ]
              }
            }]
          },
          // Add patterns to `test` if you want to enable CSS Modules for the
          // files matching the patterns.
          css_modules: {
            test: [],
            use: [{
              pipeline: "css.default"
            }, {
              loader: "css-loader",
              options: {
                modules: true
              }
            }]
          }
        }
      }
    };
  }

  _onLoaderOptions(name, options) {
    if (name === "postcss-loader" && options) {
      const plugins = Array.isArray(options.plugins) && options.plugins.length && options.plugins;
      if (plugins) {
        return Object.assign({}, options, {
          plugins: resolvePostCssPlugins(plugins)
        });
      }
    }
    return options;
  }
}

module.exports = GourmetPluginWebpackCss;
