"use strict";

const webProxy = require("@gourmet/web-proxy");

module.exports = function(gourmet, options) {
  const {staticPrefix} = options;
  return function(req, res, next) {
    if (req.url.indexOf(staticPrefix) === 0) {
      const reqOpts = gourmet.getReqOpts(options);
      reqOpts.path = req.originalUrl || req.url;
      webProxy(req, res, reqOpts, {
        handleError: next
      });
    } else {
      next();
    }
  };
};
