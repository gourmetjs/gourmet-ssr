"use strict";

const serveStatic = require("serve-static");

module.exports = function(gourmet, options) {
  const {staticPrefix, clientDir} = options;
  const ss = serveStatic(clientDir, {fallthrough: false, index: false, redirect: false});
  return function(req, res, next) {
    if (req.url.indexOf(staticPrefix) === 0) {
      const orgUrl = req.url;
      req.url = req.url.substr(staticPrefix.length - 1);  // include leading "/"
      ss(req, res, err => {
        if (err && err.code === "ENOENT") {
          err = Error("Not found: " + req.url);
          err.statusCode = 404;
        }
        req.url = orgUrl;
        next(err);
      });
    } else {
      next();
    }
  };
};
