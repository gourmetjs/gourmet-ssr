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

  onResolve() {
    // Appends `.jsx` to `resolve.extensions` so that `.jsx` can be omitted
    // in `require` or `import`.
    return {
      extensions: [".jsx"]
    };
  }

  onEntryInit(info, {target}) {
    const name = target[0].toUpperCase() + target.substr(1);
    return Object.assign({}, info, {
      classModule: "@gourmet/react-renderer/lib/React" + name + "Renderer"
    });
  }
}

PluginReact.meta = {
  hooks: {
    "build:webpack:pipelines": PluginReact.prototype.onPipelines,
    "build:webpack:loaders": PluginReact.prototype.onLoaders,
    "build:webpack:resolve": PluginReact.prototype.onResolve,
    "build:webpack:entry_init": PluginReact.prototype.onEntryInit
  }
};

module.exports = PluginReact;
