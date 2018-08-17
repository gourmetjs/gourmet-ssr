"use strict";

class PluginReactEmotion {
  onPipelines(context) {
    return {
      js: [{
        loader: "#babel-loader",
        options: {
          plugins: [{
            name: "babel-plugin-emotion",
            plugin: require.resolve("babel-plugin-emotion"),
            options: {
              hoist: context.optimize,
              sourceMap: context.sourceMap,
              autoLabel: context.debug
            }
          }]
        }
      }]
    };
  }

  onEntryInit(info, {target}) {
    const name = target[0].toUpperCase() + target.substr(1);
    return Object.assign({}, info, {
      classModule: "@gourmet/emotion-renderer/lib/Emotion" + name + "Renderer"
    });
  }
}

PluginReactEmotion.meta = {
  hooks: {
    "build:webpack:pipelines": PluginReactEmotion.prototype.onPipelines,
    "build:webpack:entry_init": PluginReactEmotion.prototype.onEntryInit
  }
};

module.exports = PluginReactEmotion;
