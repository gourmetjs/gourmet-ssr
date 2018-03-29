"use strict";

const ReactServerRenderer = require("./lib/ReactServerRenderer");

module.exports = function(render, options) {
  const r = new ReactServerRenderer(render, options);
  return r.getRenderer.bind(r);
};
