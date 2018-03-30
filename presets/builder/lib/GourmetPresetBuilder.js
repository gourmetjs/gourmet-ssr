"use strict";

class GourmetPresetBuilder {
}

GourmetPresetBuilder.meta = {
  subplugins: [
    "@gourmet/plugin-webpack-builder",
    "@gourmet/plugin-webpack-babel",
    "@gourmet/plugin-webpack-global-css"
  ]
};

module.exports = GourmetPresetBuilder;
