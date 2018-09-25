"use strict";

const relativePath = require("@gourmet/relative-path");
const sortPlugins = require("@gourmet/plugin-sort");

class GourmetPluginWebpackBabel {
  onInit(context) {
    // Note that `babel-preset-env` below 7.x doesn't support
    // browserlist's config file or `package.json`.
    // https://github.com/babel/babel-preset-env/issues/26
    return context.vars.getMulti(
      "builder.runtime." + context.target,
      ["builder.sourceModules", []]
    ).then(([runtime, sourceModules]) => {
      this._targets = context.target === "client" ? {browsers: runtime || null} : {node: runtime || "6.1"};
      this._sourceModules = context.plugins.runMergeSync("^build:source_modules", sourceModules, context);
    });
  }

  onPipelines(context) {
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
              targets: this._targets,
              loose: true
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
      }],
      js_copy: []
    };
  }

  onLoaders(context) {
    return {
      js: {
        extensions: [".js"],
        select: {
          js_copy: {
            order: 9900,
            test: [context.builder.getDirTester("node_modules", (path, idx, dir) => {
              return !this._isSource(path, idx, dir);
            })],
            pipeline: "js_copy"
          },
          js: {
            order: 9999,
            pipeline: "js"
          }
        }
      }
    };
  }

  onLoaderOptions(options) {
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

  _isSource(path, idx, dir) {
    path = relativePath(path);

    return !this._sourceModules.every(pattern => {
      if (typeof pattern === "string") {
        const spos = idx + dir.length + 1;
        const epos = spos + pattern.length;
        if (path[spos - 1] === "/" && path.substring(spos, epos) === pattern && path[epos] === "/")
          return false;
      } else if (pattern instanceof RegExp) {
        return !pattern.test(path);
      } else {
        throw Error("Invalid pattern");
      }
      return true;
    });
  }
}

GourmetPluginWebpackBabel.meta = {
  hooks: {
    "build:init": GourmetPluginWebpackBabel.prototype.onInit,
    "build:pipelines": GourmetPluginWebpackBabel.prototype.onPipelines,
    "build:loaders": GourmetPluginWebpackBabel.prototype.onLoaders,
    "build:loader_options:babel-loader": GourmetPluginWebpackBabel.prototype.onLoaderOptions
  }
};

module.exports = GourmetPluginWebpackBabel;
