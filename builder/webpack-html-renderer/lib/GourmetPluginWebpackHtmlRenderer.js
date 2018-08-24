"use strict";

class PluginHtmlRenderer {
  onEntryInit({target}) {
    return {
      renderer: [
        "@gourmet/html-renderer" + (target === "server" ? "/server" : "")
      ]
    };
  }
}

PluginHtmlRenderer.meta = {
  hooks: {
    "build:webpack:entry_init": PluginHtmlRenderer.prototype.onEntryInit
  }
};

module.exports = PluginHtmlRenderer;
