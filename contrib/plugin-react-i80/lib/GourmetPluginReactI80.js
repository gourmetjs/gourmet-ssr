"use strict";

class PluginReactI80 {
  onEntryInit({target}) {
    return {
      renderer: [`@gourmet/react-i80/renderer.${target}.js`]
    };
  }
}

PluginReactI80.meta = {
  schema: {
    after: ["@gourmet/plugin-react", "@gourmet/plugin-react-emotion"]
  },
  hooks: {
    "build:webpack:entry_init": PluginReactI80.prototype.onEntryInit
  }
};

module.exports = PluginReactI80;
