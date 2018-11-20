"use strict";

class GroupCore {
  onUserConfig(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      builder: {
        alias: {
          "@gourmet/html-renderer": moduleDir("@gourmet/html-renderer")
        }
      }
    };
  }
}

GroupCore.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-preserve-injector",
    "@gourmet/plugin-source-map-support",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css",
    "@gourmet/plugin-webpack-blob",
    "@gourmet/plugin-webpack-html-renderer"
  ],
  hooks: {
    "build:user_config": GroupCore.prototype.onUserConfig
  }
};

module.exports = GroupCore;
