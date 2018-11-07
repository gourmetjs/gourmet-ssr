"use strict";

class PluginReact {
  onUserConfig() {
    // Add `.jsx` to default extensions so that `.jsx` can be omitted
    // in `require` or `import`.
    return {
      builder: {
        defaultExtensions: [".jsx"]
      }
    };
  }

  onPipelines(context) {
    return {
      js: [{
        virtual: true,
        name: "babel-loader",
        options: {
          presets: [{
            name: "@babel/preset-react",
            preset: require.resolve("@babel/preset-react"),
            after: "@babel/preset-env",
            options: {
              useBuiltIns: true,
              development: context.debug
            }
          }]
        }
      }]
    };
  }

  onLoaders() {
    return {
      js: {
        extensions: [".jsx"]
      }
    };
  }

  onRenderer({target}) {
    return [
      "@gourmet/react-renderer" + (target === "server" ? "/server" : "")
    ];
  }
}

PluginReact.meta = {
  schema: {
    after: "@gourmet/plugin-webpack-html-renderer"
  },
  hooks: {
    "build:user_config": PluginReact.prototype.onUserConfig,
    "build:webpack_pipelines": PluginReact.prototype.onPipelines,
    "build:webpack_loaders": PluginReact.prototype.onLoaders,
    "build:page_renderer": PluginReact.prototype.onRenderer
  }
};

module.exports = PluginReact;
