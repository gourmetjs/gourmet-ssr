"use strict";

const sortPlugins = require("@gourmet/plugin-sort");

class GourmetPluginWebpackGlobalCss {
  _onWebpackPipelines(context) {
    return {
      css: [{
        name: "@gourmet/webpack-file-loader",
        loader: require.resolve("@gourmet/webpack-file-loader"),
        options: {
          name: context.build.getAssetFilenameGetter(context, {ext: ".css", isGlobal: true}),
          emitFile: context.target === "client"
        }
      }, {
        name: "extract-loader",
        loader: require.resolve("extract-loader"),
        options: {publicPath: context.staticPrefix},
      }, {
        name: "css-loader",
        loader: require.resolve("css-loader"),
        options: {
          // If you set `importLoaders` to 0, imported CSS files (`@import`) will not
          // be processed by `postcss-loader` which results in bypassing `autoprefixed`.
          // This is not a desirable behavior in default setup but you may see other
          // side effects if you use other PostCSS plugins. This is a tricky issue.
          importLoaders: 1
        }
      }, {
        name: "postcss-loader",
        loader: require.resolve("postcss-loader"),
        options: {
          plugins: [{
            // Autoprefixer uses `browserslist` and putting options under `browserslist`
            // key of `package.json` is recommended way of configuring it as opposed to
            // specifying options here.
            name: "autoprefixer",
            plugin: require("autoprefixer")
          }]
        }
      }]
    };
  }

  _onWebpackLoaders() {
    return {
      css: {
        extensions: [".css"],
        oneOf: [{
          order: 9999,
          pipeline: "css"
        }]
      }
    };
  }

  _onPostCssLoaderOptions(options) {
    if (options) {
      const plugins = Array.isArray(options.plugins) && options.plugins.length && options.plugins;
      if (plugins) {
        return Object.assign({}, options, {
          plugins: sortPlugins(plugins, {
            normalize(item) {
              return typeof item === "string" ? {name: item} : item;
            },
            finalize(item) {
              if (!item.plugin)
                item.plugin = require(item.name);

              if (item.options)
                return item.plugin(item.options);
              else
                return item.plugin();
            }
          })
        });
      }
    }
    return options;
  }
}

GourmetPluginWebpackGlobalCss.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:loaders": proto._onWebpackLoaders,
    "build:webpack:loader_options:postcss-loader": proto._onPostCssLoaderOptions
  }))(GourmetPluginWebpackGlobalCss.prototype)
};

module.exports = GourmetPluginWebpackGlobalCss;
