"use strict";

class GroupReactEmotion {
  onUserConfig(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      builder: {
        alias: {
          "emotion": moduleDir("emotion"),
          "react-emotion": moduleDir("react-emotion"),
          "@gourmet/emotion-renderer": moduleDir("@gourmet/emotion-renderer")
        }
      }
    };
  }
}

GroupReactEmotion.meta = {
  subplugins: [
    "@gourmet/plugin-react-emotion"
  ],
  hooks: {
    "build:user_config": GroupReactEmotion.prototype.onUserConfig
  }
};

module.exports = GroupReactEmotion;
