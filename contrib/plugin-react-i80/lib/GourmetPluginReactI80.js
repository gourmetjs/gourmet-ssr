"use strict";

class PluginReactI80 {
  onEntryInit(info, context) {
    return {
      prerender: [`@gourmet/react-i80/src/prerender.${context.target}.js`]
    };
  }
}

PluginReactI80.meta = {
  hooks: {
    "build:webpack:entry_init": PluginReactI80.prototype.onEntryInit
  }
};

module.exports = PluginReactI80;
