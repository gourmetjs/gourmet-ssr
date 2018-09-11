"use strict";

const GourmetWatchMiddleware = require("./GourmetWatchMiddleware");

module.exports = function(gourmet) {
  const m = new GourmetWatchMiddleware(gourmet);
  return GourmetWatchMiddleware.prototype.handle.bind(m);
};
