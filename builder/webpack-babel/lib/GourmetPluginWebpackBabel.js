"use strict";

const sortPlugins = require("@gourmet/plugin-sort");
const promiseMap = require("@gourmet/promise-map");

class GourmetPluginWebpackBabel {
  _onWebpackInit(context) {
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

    return promiseMap([_targets, _loose], f => f()).then(([targets, loose]) => {
      this._varCache = {targets, loose};
    });
  }

  _onWebpackPipelines(context) {
    // Note that the object returned from this hook is merged with other
    // plugins's result. Arrays are appended by default, so `presets` and
    // `plugins` are appended too.
    return {
      js: [{
        name: "babel-loader",
        loader: require.resolve("babel-loader"),
        options: {
          //cacheDirectory: true,
          presets: [{
            name: "babel-preset-env",
            preset: require.resolve("babel-preset-env"),
            options: {
              modules: false,
              targets: this._varCache.targets,
              loose: this._varCache.loose
            }
          }],

          plugins: (() => {
            const plugins = [];

            if (context.target === "client") {
              plugins.push({
                name: "babel-plugin-syntax-dynamic-import",
                plugin: require.resolve("babel-plugin-syntax-dynamic-import")
              });
            } else {
              plugins.push({
                name: "babel-plugin-dynamic-import-node",
                plugin: require.resolve("babel-plugin-dynamic-import-node")
              });
            }

            // We can't turn this on by default due to the following issue:
            // https://github.com/webpack/webpack/issues/4039
            //
            //   "babel-plugin-transform-runtime"

            return plugins;
          })()
        }
      }]
    };
  }

  _onWebpackLoaders() {
    return {
      js: {
        extensions: [".js"],
        oneOf: [{
          order: 9999,
          pipeline: "js"
        }]
      }
    };
  }

  _onLoaderOptions(options) {
    function _sort(items) {
      return items && sortPlugins(items, {
        normalize(item) {
          return typeof item === "string" ? {name: item} : item;
        },
        finalize(item) {
          if (item.options)
            return [item.preset || item.plugin || item.name, item.options];
          else
            return item.preset || item.plugin || item.name;
        }
      });
    }

    if (options) {
      const presets = Array.isArray(options.presets) && options.presets.length && options.presets;
      const plugins = Array.isArray(options.plugins) && options.plugins.length && options.plugins;
      if (presets || plugins) {
        return Object.assign({}, options, {
          presets: _sort(presets),
          plugins: _sort(plugins)
        });
      }
    }
    return options;
  }
}

GourmetPluginWebpackBabel.meta = {
  hooks: (proto => ({
    "build:webpack:init": proto._onWebpackInit,
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:loaders": proto._onWebpackLoaders,
    "build:webpack:loader_options:babel-loader": proto._onLoaderOptions
  }))(GourmetPluginWebpackBabel.prototype)
};

module.exports = GourmetPluginWebpackBabel;
