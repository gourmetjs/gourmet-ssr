"use strict";

class PluginReactI80 {
  onRenderer({target}) {
    return [`@gourmet/react-i80/renderer.${target}.js`];
  }
}

PluginReactI80.meta = {
  schema: {
    after: ["@gourmet/plugin-react", "@gourmet/plugin-react-emotion"]
  },
  hooks: {
    "build:page_renderer": PluginReactI80.prototype.onRenderer
  }
};

module.exports = PluginReactI80;
