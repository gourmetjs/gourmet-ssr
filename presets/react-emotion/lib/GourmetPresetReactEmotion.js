"use strict";

// This preset is designed to replace `@gourmet/preset-react`, instead of being
// supplemental to avoid peer dependency warnings from React, Webpack & Babel
// plugins.
class PresetReactEmotion {
  onAlias(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      "@gourmet/react-context-gmctx": moduleDir("@gourmet/react-context-gmctx"),
      "@gourmet/react-loadable": moduleDir("@gourmet/react-loadable"),
      "react-hot-loader": moduleDir("react-hot-loader"),
      "emotion": moduleDir("emotion"),
      "react-emotion": moduleDir("react-emotion"),
      "@gourmet/emotion-renderer": moduleDir("@gourmet/emotion-renderer"),
      "@gourmet/watch-middleware": moduleDir("@gourmet/watch-middleware")
    };
  }
}

PresetReactEmotion.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css",
    "@gourmet/plugin-webpack-blob",
    "@gourmet/plugin-webpack-dev-server",
    "@gourmet/plugin-webpack-react",
    "@gourmet/plugin-webpack-react-hot-loader",
    "@gourmet/plugin-webpack-react-loadable",
    "@gourmet/plugin-react-emotion"
  ],
  hooks: {
    "build:webpack:alias": PresetReactEmotion.prototype.onAlias
  }
};

module.exports = PresetReactEmotion;
