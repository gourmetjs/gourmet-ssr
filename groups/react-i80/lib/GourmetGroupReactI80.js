"use strict";

class GroupReactI80 {
  onUserConfig(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      builder: {
        alias: {
          "@gourmet/react-i80": moduleDir("@gourmet/react-i80")
        }
      }
    };
  }
}

GroupReactI80.meta = {
  subplugins: [
    "@gourmet/plugin-react-i80"
  ],
  hooks: {
    "build:user_config": GroupReactI80.prototype.onUserConfig
  }
};

module.exports = GroupReactI80;
