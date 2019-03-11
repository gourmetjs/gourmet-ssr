"use strict";

// We added a dependency entry `core-js: "2"` for the reason below:
// https://babeljs.io/docs/en/babel-preset-env#usebuiltins
class GroupReactApollo {
  onUserConfig(context) {
    const moduleDir = context.builder.moduleDir(__dirname);
    return {
      builder: {
        alias: {
          "react-apollo": moduleDir("react-apollo"),
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
