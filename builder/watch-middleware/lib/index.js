"use strict";

const GourmetWatchMiddleware = require("./GourmetWatchMiddleware");

module.exports = function(options, gourmet) {
  const m = new GourmetWatchMiddleware(options, gourmet);
  return GourmetWatchMiddleware.prototype.handle.bind(m);
};
