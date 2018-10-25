"use strict";

const relativePath = require("@gourmet/relative-path");
const sortPlugins = require("@gourmet/plugin-sort");

class GourmetPluginWebpackBabel {
  onInit(context) {
    // Note that `babel-preset-env` below 7.x doesn't support
    // browserlist's config file or `package.json`.
    // https://github.com/babel/babel-preset-env/issues/26
    if (context.target === "client")
      this._targets = {browsers: context.config.builder.runtime.client};
    else
      this._targets = {node: context.config.builder.runtime.server};

    this._vendorSourceDirs = context.config.builder.vendorSourceDirs.map(dir => {
      if (typeof dir !== "string")
        return dir;
      if (dir[0] !== "/")
        dir = "/" + dir;
      if (dir[dir.length - 1] !== "/")
        dir = dir + "/";
      return dir;
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
    const dirs = this._vendorSourceDirs;

    path = relativePath(path);

    for (let idx = 0; idx < dirs.length; idx++) {
      const pattern = dirs[idx];
      if (typeof pattern === "string") {
        const spos = idx + dir.length;
        if (path.indexOf(pattern, spos) !== -1)
          return true;
      } else if (pattern instanceof RegExp) {
        if (pattern.test(path))
          return true;
      } else {
        throw Error("Invalid pattern");
      }
    }

    return false;
  }
}

GourmetPluginWebpackBabel.meta = {
  hooks: {
    "build:init": GourmetPluginWebpackBabel.prototype.onInit,
    "build:webpack_pipelines": GourmetPluginWebpackBabel.prototype.onPipelines,
    "build:webpack_loaders": GourmetPluginWebpackBabel.prototype.onLoaders,
    "build:webpack_loader_options:babel-loader": GourmetPluginWebpackBabel.prototype.onLoaderOptions
  }
};

module.exports = GourmetPluginWebpackBabel;
