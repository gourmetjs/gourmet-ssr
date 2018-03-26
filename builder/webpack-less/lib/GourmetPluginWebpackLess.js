"use strict";

class GourmetPluginWebpackLess {
  _onWebpackPipelines() {
    return {
      less: [{
        pipeline: "css"
      }, {
        loader: "less-loader",
        options: {}
      }]
    };
  }

  _onWebpackRules() {
    return {
      less: {
        extensions: [".less"],
        oneOf: [{
          order: 9999,
          pipeline: "less"
        }]
      }
    };
  }
}

GourmetPluginWebpackLess.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:rules": proto._onWebpackRules
  }))(GourmetPluginWebpackLess.prototype)
};

module.exports = GourmetPluginWebpackLess;
