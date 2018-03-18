"use strict";

const sortPlugins = require("@gourmet/plugin-sort");

class GourmetPluginWebpackBabel {
  _onWebpackLoaders(build) {
    // Note that the object returned from this hook is merged with other
    // plugins's result. Arrays are appended by default, so `presets` and
    // `plugins` are appended too.
    return {
      js: {
        extensions: ["js"],
        pipelines: {
          vendor: {
            test: [build.getVendorDirTester()],
            use: []
          },
          default: {
            use: [{
              loader: "babel-loader",
              options: {
                cacheDirectory: true,

                presets: [{
                  name: "babel-preset-env",
                  plugin: require.resolve("babel-preset-env"),
                  options: {
                    targets: {
                      // Currently, babel-preset-env doesn't support browserlist config file.
                      // This is a temporary solution until the problem is fixed.
                      // https://github.com/babel/babel-preset-env/issues/26
                      //browser: build.getRootPackage().browserslist || ""
                    },
                    loose: true,
                    uglify: true,
                    modules: false,
                    useBuiltIns: true
                  }
                }],

                plugins: [{
                  name: "babel-plugin-syntax-dynamic-import",
                  plugin: require.resolve("babel-plugin-syntax-dynamic-import")
                /*}, {
                  // We can't turn this on by default due to the following issue:
                  // https://github.com/webpack/webpack/issues/4039
                  name: "babel-plugin-transform-runtime"*/
                }]
              }
            }]
          }
        }
      }
    };
  }

  _onBabelLoaderOptions(options) {
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
    "build:webpack:loader_options:babel-loader": proto._onBabelLoaderOptions
  }))(GourmetPluginWebpackBabel.prototype)
};

module.exports = GourmetPluginWebpackBabel;
