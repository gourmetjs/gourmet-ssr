"use strict";

const HtmlServerRenderer = require("./lib/HtmlServerRenderer");

module.exports = function(render, options) {
  const r = new HtmlServerRenderer(render, options);
  return r.getRenderer.bind(r);
};
