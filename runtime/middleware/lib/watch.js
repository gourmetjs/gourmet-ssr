"use strict";

const GourmetWatchMiddleware = require("@gourmet/watch-middleware");

module.exports = function(gourmet) {
  return GourmetWatchMiddleware.middleware(gourmet);
};
