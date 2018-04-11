"use strict";

class GourmetPresetReactEmotion {
  _onWebpackAlias(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      "emotion": moduleDir("emotion"),
      "react-emotion": moduleDir("react-emotion"),
      "@gourmet/emotion-renderer": moduleDir("@gourmet/emotion-renderer")
    };
  }
}

GourmetPresetReactEmotion.meta = {
  subplugins: [
    "@gourmet/preset-react",
    "@gourmet/plugin-react-emotion"
  ],
  hooks: {
    "build:webpack:alias": GourmetPresetReactEmotion.prototype._onWebpackAlias
  }
};

module.exports = GourmetPresetReactEmotion;
