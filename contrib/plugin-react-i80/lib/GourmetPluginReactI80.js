"use strict";

class PluginReactI80 {
  onPageRenderer({target}) {
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
    "build:page_renderer": PluginReactI80.prototype.onPageRenderer
  }
};

module.exports = PluginReactI80;
