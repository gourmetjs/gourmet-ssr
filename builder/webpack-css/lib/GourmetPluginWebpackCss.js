"use strict";

const resolvePostCssPlugins = require("@gourmet/resolve-postcss-plugins");

class GourmetPluginWebpackCss {
  _onWebpackPipelines() {
    return {
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
      }]
    };
  }

  _onWebpackRules() {
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
          plugins: resolvePostCssPlugins(plugins)
        });
      }
    }
    return options;
  }
}

GourmetPluginWebpackCss.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:rules": proto._onWebpackRules,
    "build:webpack:loader_options:postcss-loader": proto._onPostCssLoaderOptions
  }))(GourmetPluginWebpackCss.prototype)
};

module.exports = GourmetPluginWebpackCss;
