"use strict";

const sortPlugins = require("@gourmet/plugin-sort");

class GourmetPluginWebpackBabel {
  _onWebpackLoaders(context) {
    // Note that the object returned from this hook is merged with other
    // plugins's result. Arrays are appended by default, so `presets` and
    // `plugins` are appended too.
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
                    targets: this._getBabelEnvTargets(context),
                    modules: false,
                    loose: true,
                    useBuiltIns: true
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

                  if (context.stage === "hot")
                    plugins.push("react-hot-loader/babel");

                  return plugins;
                })()
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

  // Note that `babel-preset-env` below 7.x doesn't support
  // browserlist's config file or `package.json`.
  // https://github.com/babel/babel-preset-env/issues/26
  _getBabelEnvTargets(context) {
    const ver = context.build.getTargetRuntimeVersion();
    return context.target === "client" ? {browsers: ver} : {node: ver};
  }
}

GourmetPluginWebpackBabel.meta = {
  hooks: (proto => ({
    "build:webpack:loaders": proto._onWebpackLoaders,
    "build:webpack:loader_options:babel-loader": proto._onBabelLoaderOptions
  }))(GourmetPluginWebpackBabel.prototype)
};

module.exports = GourmetPluginWebpackBabel;
