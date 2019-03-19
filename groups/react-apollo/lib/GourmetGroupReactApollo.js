"use strict";

class GroupReactApollo {
  onUserConfig(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      builder: {
        alias: {
          "react-apollo": moduleDir("react-apollo"),
          "graphql-tag": moduleDir("graphql-tag"),
          "@gourmet/react-apollo-renderer": moduleDir("@gourmet/react-apollo-renderer")
        }
      }
    };
  }
}

GroupReactApollo.meta = {
  subplugins: [
    "@gourmet/plugin-react-apollo"
  ],
  hooks: {
    "build:user_config": GroupReactApollo.prototype.onUserConfig
  }
};

module.exports = GroupReactApollo;
