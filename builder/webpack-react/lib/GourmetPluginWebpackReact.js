"use strict";

class GourmetPluginWebpackReact {
  _onWebpackPipelines(context) {
    return {
      js: [{
        loader: "#babel-loader",
        options: {
          presets: [{
            name: "babel-preset-react",
            after: "babel-preset-env"
          }],
          plugins: (() => {
            if (context.stage === "hot")
              return ["react-hot-loader/babel"];
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
