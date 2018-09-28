"use strict";

class PluginHtmlRenderer {
  onRenderer({target}) {
    return [
      "@gourmet/html-renderer" + (target === "server" ? "/server" : "")
    ];
  }
}

PluginHtmlRenderer.meta = {
  hooks: {
    "build:page_renderer": PluginHtmlRenderer.prototype.onRenderer
  }
};

module.exports = PluginHtmlRenderer;
