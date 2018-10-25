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
        loader: "#babel-loader",
        options: {
          presets: [{
            name: "babel-preset-react",
            preset: require.resolve("babel-preset-react"),
            after: "babel-preset-env"
          }],
          plugins: [
            "babel-plugin-transform-class-properties",
            "babel-plugin-transform-object-rest-spread"
          ].concat(context.debug ? ["babel-plugin-transform-react-jsx-source"] : [])
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
