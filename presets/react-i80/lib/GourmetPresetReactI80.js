"use strict";

// This preset is designed to supplement `@gourmet/preset-react` to add 
// packages required to use `@gourmet/react-i80`.
class PresetReactI80 {
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

PresetReactI80.meta = {
  subplugins: [
    "@gourmet/plugin-react-i80"
  ],
  hooks: {
    "build:user_config": PresetReactI80.prototype.onUserConfig
  }
};

module.exports = PresetReactI80;
