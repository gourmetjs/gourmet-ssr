"use strict";

const HtmlClientRenderer = require("./lib/HtmlClientRenderer");

module.exports = function(render, options) {
  return new HtmlClientRenderer(render, options);
};
