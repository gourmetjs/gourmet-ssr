"use strict";

class PresetCore {
  onAlias(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      "@gourmet/html-renderer": moduleDir("@gourmet/html-renderer")
    };
  }
}

PresetCore.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-webpack-preserve-injector",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css",
    "@gourmet/plugin-webpack-blob",
    "@gourmet/plugin-webpack-html-renderer"
  ],
  hooks: {
    "build:alias": PresetCore.prototype.onAlias
  }
};

module.exports = PresetCore;
