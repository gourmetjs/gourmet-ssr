"use strict";

class GourmetPresetReact {
  _onWebpackAlias(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      "react": moduleDir("react"),
      "react-dom": moduleDir("react-dom"),
      "classnames": moduleDir("classnames"),
      "prop-types": moduleDir("prop-types"),
      "@gourmet/self-url": moduleDir("@gourmet/self-url"),
      "@gourmet/react-context-provider": moduleDir("@gourmet/react-context-provider"),
      "@gourmet/react-renderer": moduleDir("@gourmet/react-renderer")
    };
  }
}

GourmetPresetReact.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-react",
    "@gourmet/plugin-webpack-react-hot-loader"
  ],
  hooks: {
    "build:webpack:alias": GourmetPresetReact.prototype._onWebpackAlias
  }
};

module.exports = GourmetPresetReact;
