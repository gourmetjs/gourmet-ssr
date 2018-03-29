"use strict";

class GourmetPluginWebpackReact {
  _onWebpackPipelines(context) {
    return {
      js: [{
        loader: "#babel-loader",
        options: {
          presets: [{
            name: "babel-preset-react",
            preset: require.resolve("babel-preset-react"),
            after: "babel-preset-env"
          }],
          plugins: (() => {
            const plugins = [];
            if (context.stage === "hot") {
              plugins.push({
                name: "react-hot-loader/babel",
                plugin: require.resolve("react-hot-loader/babel")
              });
            }
            return plugins;
          })()
        }
      }]
    };
  }

  _onWebpackLoaders() {
    return {
      js: {
        extensions: [".jsx"]
      }
    };
  }

  _onWebpackResolve() {
    // Appends `.jsx` to `resolve.extensions` so that `.jsx` can be omitted
    // in `require` or `import`.
    return {
      extensions: [".jsx"]
    };
  }
}

GourmetPluginWebpackReact.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:loaders": proto._onWebpackLoaders,
    "build:webpack:resolve": proto._onWebpackResolve
  }))(GourmetPluginWebpackReact.prototype)
};

module.exports = GourmetPluginWebpackReact;
