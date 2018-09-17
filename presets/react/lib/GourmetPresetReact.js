"use strict";

// This preset is designed to replace `@gourmet/preset-core`, instead of being
// supplemental to avoid peer dependency warnings from React, Webpack & Babel
// plugins.
class PresetReact {
  onAlias(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      "@gourmet/html-renderer": moduleDir("@gourmet/html-renderer"),
      "@gourmet/react-context-gmctx": moduleDir("@gourmet/react-context-gmctx"),
      "@gourmet/react-renderer": moduleDir("@gourmet/react-renderer"),
      "@gourmet/react-loadable": moduleDir("@gourmet/react-loadable")
    };
  }
}

PresetReact.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-preserve-injector",
    "@gourmet/plugin-source-map-support",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css",
    "@gourmet/plugin-webpack-blob",
    "@gourmet/plugin-webpack-html-renderer",
    "@gourmet/plugin-react",
    "@gourmet/plugin-react-loadable"
  ],
  hooks: {
    "build:alias": PresetReact.prototype.onAlias
  }
};

module.exports = PresetReact;
