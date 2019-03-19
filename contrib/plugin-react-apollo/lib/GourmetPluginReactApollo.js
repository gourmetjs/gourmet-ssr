"use strict";

class PluginReactApollo {
  async onUserConfig(context) {
    const apollo = await context.vars.get("apollo");
    if (apollo) {
      return {
        builder: {
          initOptions: {
            apollo
          }
        }
      };
    }
  }

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
    "build:user_config": PluginReactApollo.prototype.onUserConfig,
    "build:page_renderer": PluginReactApollo.prototype.onPageRenderer
  }
};

module.exports = PluginReactApollo;
