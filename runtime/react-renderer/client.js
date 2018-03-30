"use strict";

const ReactClientRenderer = require("./lib/ReactClientRenderer");

module.exports = function(render, options) {
  return new ReactClientRenderer(render, options);
};
