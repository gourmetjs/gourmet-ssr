"use strict";

class PresetCore {
  onAlias(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      "@gourmet/html-renderer": moduleDir("@gourmet/html-renderer"),
      "@gourmet/watch-middleware": moduleDir("@gourmet/watch-middleware")
    };
  }
}

PresetCore.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css",
    "@gourmet/plugin-webpack-blob",
    "@gourmet/plugin-webpack-dev-server",
    "@gourmet/plugin-webpack-html-renderer"
  ],
  hooks: {
    "build:alias": PresetCore.prototype.onAlias
  }
};

module.exports = PresetCore;
