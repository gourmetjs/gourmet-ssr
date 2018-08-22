"use strict";

// This preset is designed to replace `@gourmet/preset-core`, instead of being
// supplemental to avoid peer dependency warnings from React, Webpack & Babel
// plugins.
class PresetReact {
  onAlias(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      "@gourmet/react-context-gmctx": moduleDir("@gourmet/react-context-gmctx"),
      "@gourmet/react-renderer": moduleDir("@gourmet/react-renderer"),
      "@gourmet/react-loadable": moduleDir("@gourmet/react-loadable"),
      "@gourmet/react-i80": moduleDir("@gourmet/react-i80"),
      "react-hot-loader": moduleDir("react-hot-loader"),
      "@gourmet/watch-middleware": moduleDir("@gourmet/watch-middleware")
    };
  }
}

PresetReact.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css",
    "@gourmet/plugin-webpack-blob",
    "@gourmet/plugin-webpack-dev-server",
    "@gourmet/plugin-react",
    "@gourmet/plugin-react-hot-loader",
    "@gourmet/plugin-react-loadable",
    "@gourmet/plugin-react-i80"
  ],
  hooks: {
    "build:webpack:alias": PresetReact.prototype.onAlias
  }
};

module.exports = PresetReact;
