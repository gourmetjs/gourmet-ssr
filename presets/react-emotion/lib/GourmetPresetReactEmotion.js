"use strict";

// 8/17/2018 Added `prop-types` to prevent the following warning from yarn:
//   "@gourmet/preset-react-emotion > react-emotion > create-emotion-styled@9.2.6" has unmet peer dependency "prop-types@15.x".
class PresetReactEmotion {
}

PresetReactEmotion.meta = {
  subplugins: [
    "@gourmet/group-core",
    "@gourmet/group-react",
    "@gourmet/group-react-emotion"
  ]
};

module.exports = PresetReactEmotion;
