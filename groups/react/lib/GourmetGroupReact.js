"use strict";

class GroupReact {
  onUserConfig(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      builder: {
        alias: {
          "@gourmet/react-context-gmctx": moduleDir("@gourmet/react-context-gmctx"),
          "@gourmet/react-renderer": moduleDir("@gourmet/react-renderer"),
          "@gourmet/react-loadable": moduleDir("@gourmet/react-loadable")
        }
      }
    };
  }
}

GroupReact.meta = {
  subplugins: [
    "@gourmet/plugin-react",
    "@gourmet/plugin-react-loadable"
  ],
  hooks: {
    "build:user_config": GroupReact.prototype.onUserConfig
  }
};

module.exports = GroupReact;
