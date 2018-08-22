"use strict";

class PluginHtmlRenderer {
  onEntryInit(info, {target}) {
    const name = target[0].toUpperCase() + target.substr(1);
    return Object.assign({}, info, {
      classModule: "@gourmet/html-renderer/src/Html" + name + "Renderer"
    });
  }
}

PluginHtmlRenderer.meta = {
  hooks: {
    "build:webpack:entry_init": PluginHtmlRenderer.prototype.onEntryInit
  }
};

module.exports = PluginHtmlRenderer;
