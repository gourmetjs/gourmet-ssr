"use strict";

const sortPlugins = require("@gourmet/plugin-sort");
const promiseMap = require("@gourmet/promise-map");

class GourmetPluginWebpackBabel {
  _onWebpackLoaders(context) {
    // Note that `babel-preset-env` below 7.x doesn't support
    // browserlist's config file or `package.json`.
    // https://github.com/babel/babel-preset-env/issues/26
    function _targets() {
      return context.vars.get("builder.runtime." + context.target).then(value => {
        return context.target === "client" ? {browsers: value || null} : {node: value || "6.1"};
      });
    }

    function _loose() {
      return context.vars.get("babel.loose", true);
    }

    // Note that the object returned from this hook is merged with other
    // plugins's result. Arrays are appended by default, so `presets` and
    // `plugins` are appended too.
    return promiseMap([_targets, _loose], f => f()).then(([targets, loose]) => {
      return {
        js: {
          extensions: ["js"],
          pipelines: {
            vendor: {
              test: [context.build.getVendorDirTester()],
              use: []
            },
            default: {
              use: [{
                loader: "babel-loader",
                options: {
                  //cacheDirectory: true,
                  presets: [{
                    name: "babel-preset-env",
                    options: {
                      modules: false,
                      targets: targets,
                      loose: loose
                    }
                  }],

                  plugins: (() => {
                    const plugins = [];

                    if (context.target === "client")
                      plugins.push("babel-plugin-syntax-dynamic-import");
                    else
                      plugins.push("babel-plugin-dynamic-import-node");

                    // We can't turn this on by default due to the following issue:
                    // https://github.com/webpack/webpack/issues/4039
                    //
                    //   "babel-plugin-transform-runtime"

                    return plugins;
                  })()
                }
              }]
            }
          }
        }
      };
    });
  }

  _onFinalizeLoaderOptions(options) {
    if (options) {
      const presets = Array.isArray(options.presets) && options.presets.length && options.presets;
      const plugins = Array.isArray(options.plugins) && options.plugins.length && options.plugins;
      if (presets || plugins) {
        return Object.assign({}, options, {
          presets: presets && this._sortPlugins(presets),
          plugins: plugins && this._sortPlugins(plugins)
        });
      }
    }
    return options;
  }

  _sortPlugins(items) {
    return sortPlugins(items, {
      normalize(item) {
        return typeof item === "string" ? {name: item} : item;
      },
      finalize(item) {
        if (item.options)
          return [item.plugin || item.name, item.options];
        else
          return item.plugin || item.name;
      }
    });
  }
}

GourmetPluginWebpackBabel.meta = {
  hooks: (proto => ({
    "build:webpack:loaders": proto._onWebpackLoaders,
    "build:webpack:finalize_loader_options:babel-loader": proto._onFinalizeLoaderOptions
  }))(GourmetPluginWebpackBabel.prototype)
};

module.exports = GourmetPluginWebpackBabel;
