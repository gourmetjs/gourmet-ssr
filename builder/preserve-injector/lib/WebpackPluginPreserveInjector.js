"use strict";

const {ConcatSource} = require("webpack-sources");

module.exports = class WebpackPluginPreserveInjector {
  apply(compiler) {
    compiler.hooks.compilation.tap("WebpackPluginPreserveInjector", compilation => {
      const {mainTemplate} = compilation;
      mainTemplate.hooks.renderWithEntry.tap(
        "WebpackPluginPreserveInjector",
        source => {
          return new ConcatSource("// @preserve\n", source);
        }
      );
    });
  }
};
