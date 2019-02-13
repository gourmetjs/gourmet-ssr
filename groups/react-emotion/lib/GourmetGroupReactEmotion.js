"use strict";

// 8/17/2018 Added `prop-types` to prevent the following warning from yarn:
//   "@gourmet/group-react-emotion > react-emotion > create-emotion-styled@9.2.6" has unmet peer dependency "prop-types@15.x".
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
