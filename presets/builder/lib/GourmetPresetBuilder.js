"use strict";

class GourmetPresetBuilder {
}

GourmetPresetBuilder.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-webpack-dev-server",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css",
    "@gourmet/plugin-webpack-blob"
  ]
};

module.exports = GourmetPresetBuilder;
