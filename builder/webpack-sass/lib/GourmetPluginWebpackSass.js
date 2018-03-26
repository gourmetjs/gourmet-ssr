"use strict";

class GourmetPluginWebpackSass {
  _onWebpackPipelines() {
    return {
      sass: [{
        pipeline: "css"
      }, {
        loader: "resolve-url-loader"
      }, {
        loader: "sass-loader",
        options: {sourceMap: true}
      }]
    };
  }

  _onWebpackRules() {
    return {
      sass: {
        extensions: [".sass", ".scss"],
        oneOf: [{
          order: 9999,
          pipeline: "less"
        }]
      }
    };
  }
}

module.exports = GourmetPluginWebpackSass;
