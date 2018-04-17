"use strict";

const GourmetWatchMiddleware = require("./GourmetWatchMiddleware");

module.exports = function(options) {
  const m = new GourmetWatchMiddleware(options);
  const handler = GourmetWatchMiddleware.prototype.handle.bind(m);
  handler.gourmet = m.gourmet;
  return handler;
};
