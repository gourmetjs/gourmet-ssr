"use strict";

const {ConcatSource} = require("webpack-sources");

const NAME = "WebpackPluginPreserveInjector";

module.exports = class WebpackPluginPreserveInjector {
  apply(compiler) {
    compiler.hooks.compilation.tap(NAME, compilation => {
      const {mainTemplate} = compilation;
      mainTemplate.hooks.renderWithEntry.tap(NAME, source => {
        return new ConcatSource("// @preserve\n", source);
      });
    });
  }
};
