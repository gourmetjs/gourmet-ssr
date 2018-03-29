"use strict";

const EmotionClientRenderer = require("./lib/EmotionClientRenderer");

module.exports = function(render, options) {
  return new EmotionClientRenderer(render, options);
};
