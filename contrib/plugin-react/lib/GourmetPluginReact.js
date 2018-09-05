"use strict";

class PluginReact {
  onPipelines() {
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
          ]
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

  onResolve() {
    // Appends `.jsx` to `resolve.extensions` so that `.jsx` can be omitted
    // in `require` or `import`.
    return {
      extensions: [".jsx"]
    };
  }

  onRenderer({target}) {
    return {
      renderer: [
        "@gourmet/react-renderer" + (target === "server" ? "/server" : "")
      ]
    };
  }
}

PluginReact.meta = {
  schema: {
    after: "@gourmet/plugin-webpack-html-renderer"
  },
  hooks: {
    "build:pipelines": PluginReact.prototype.onPipelines,
    "build:loaders": PluginReact.prototype.onLoaders,
    "build:resolve": PluginReact.prototype.onResolve,
    "build:page_renderer": PluginReact.prototype.onRenderer
  }
};

module.exports = PluginReact;
