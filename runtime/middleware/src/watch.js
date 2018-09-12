"use strict";

const watchMiddleware = require("@gourmet/watch-middleware");

module.exports = function(gourmet) {
  return watchMiddleware(gourmet);
};
