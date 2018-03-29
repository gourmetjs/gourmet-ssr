"use strict";

const EmotionServerRenderer = require("./lib/EmotionServerRenderer");

module.exports = function(render, options) {
  const r = new EmotionServerRenderer(render, options);
  return r.getRenderer.bind(r);
};
