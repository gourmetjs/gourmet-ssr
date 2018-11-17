"use strict";

const sortPlugins = require("@gourmet/plugin-sort");
const merge = require("@gourmet/merge");

class GourmetPluginWebpackGlobalCss {
  onDefaultConfig() {
    return {
      postcss: {
        // Use 'postcss-loader's configuration files instead of options
        // specified in `gourmet_config.js`.
        // If you set this to `true`, `postcss=loader` is specified without any
        // options or plugins. You should specify options in `postcss.config.js`
        // file as described in https://github.com/postcss/postcss-loader#configuration
        useConfigFile: false,

        // `postcss-loader`'s `sourceMap` option follows `builder.sourceMap` by default.
        sourceMap: context => {
          return context.vars.get("builder.sourceMap");
        },

        // Where to load browserslist configuration:
        //  - "gourmet": global setting from `builder.runtime` of `gourmet_config.js`.
        //  - "file": file-relative configuration lookup beginning at each source file's directory
        browserslist: "gourmet",  // "gourmet", "file",

        // Note that the format of `plugins` is extended from Babel's.
        // `{name: "name", plugin: fn, options: {...}}`
        plugins: [],

        // Additional custom options to provide to `postcss-loader`.
        options: {},

        // Additional custom options to provide to `autoprefixer`.
        autoprefixer: {},

        // Additional custom options to provide to `clean-css`.
        cleancss: {}
      }
    };
  }

  onPipelines(context) {
    const postcss = context.config.postcss;
    const bl = postcss.browserslist;
    const autoprefixer = merge({
      browsers: bl === "gourmet" ? context.config.builder.runtime.client : undefined,
      env: context.target === "server" ? context.stage + ":server" : context.stage
    }, postcss.autoprefixer);
    const options = merge({
      plugins: [{
        name: "autoprefixer",
        plugin: require("autoprefixer"),
        options: autoprefixer
      }, context.config.builder.minify && {
        name: "@gourmet/postcss-plugin-cleancss",
        plugin: require("@gourmet/postcss-plugin-cleancss"),
        options: postcss.cleancss
      }].concat(postcss.plugins).filter(Boolean)
    }, postcss.options);

    return {
      // "css": performs a full transformation of CSS file
      css: [{
        name: "@gourmet/webpack-file-loader",
        loader: require.resolve("@gourmet/webpack-file-loader"),
        options: {
          name: context.builder.getAssetFilenameGetter(context, {ext: ".css", type: "global_css"}),
          emitFile: context.target === "client"
        }
      }, {
        name: "extract-loader",
        loader: require.resolve("extract-loader"),
        options: {publicPath: context.config.builder.staticPrefix}
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
        options: postcss.useConfigFile ? undefined : options
      }],

      // "css_resolve": performs a resolution of 'url' and '@import', skipping PostCSS
      css_resolve: [{
        name: "@gourmet/webpack-file-loader",
        loader: require.resolve("@gourmet/webpack-file-loader"),
        options: {
          name: context.builder.getAssetFilenameGetter(context, {ext: ".css", type: "global_css"}),
          emitFile: context.target === "client"
        }
      }, {
        name: "extract-loader",
        loader: require.resolve("extract-loader"),
        options: {publicPath: context.config.builder.staticPrefix}
      }, {
        name: "css-loader",
        loader: require.resolve("css-loader")
      }],

      // "css_copy": performs a simple copy, no transformation at all
      css_copy: [{
        name: "@gourmet/webpack-file-loader",
        loader: require.resolve("@gourmet/webpack-file-loader"),
        options: {
          name: context.builder.getAssetFilenameGetter(context, {ext: ".css", type: "global_css"}),
          emitFile: context.target === "client"
        }
      }]
    };
  }

  onLoaders(context) {
    return {
      css: {
        extensions: [".css"],
        select: {
          css_copy: {
            order: 9800,
            test: [],
            pipeline: "css_copy"
          },
          css_resolve: {
            order: 9900,
            test: [context.builder.getDirTester("node_modules")],
            pipeline: "css_resolve"
          },
          css: {
            order: 9999,
            pipeline: "css"
          }
        }
      }
    };
  }

  onPostCssOptions(options) {
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
  hooks: {
    "build:default_config": GourmetPluginWebpackGlobalCss.prototype.onDefaultConfig,
    "build:webpack_pipelines": GourmetPluginWebpackGlobalCss.prototype.onPipelines,
    "build:webpack_loaders": GourmetPluginWebpackGlobalCss.prototype.onLoaders,
    "build:webpack_loader_options:postcss-loader": GourmetPluginWebpackGlobalCss.prototype.onPostCssOptions
  }
};

module.exports = GourmetPluginWebpackGlobalCss;
