"use strict";

class PluginReactApollo {
  onPageRenderer({target}) {
    return [
      "@gourmet/react-apollo-renderer" + (target === "server" ? "/server" : "")
    ];
  }
}

PluginReactApollo.meta = {
  schema: {
    after: "@gourmet/plugin-react"
  },
  hooks: {
    "build:page_renderer": PluginReactApollo.prototype.onPageRenderer
  }
};

module.exports = PluginReactApollo;
