"use strict";

const getReqArgs = require("@gourmet/get-req-args");
const sendContent = require("@gourmet/send-content");
const merge = require("@gourmet/merge");
const webProxy = require("@gourmet/web-proxy");

module.exports = function factory(gourmet, baseOptions) {
  return function createMiddleware(options) {
    gourmet.baseOptions = options = merge.intact({
      staticMiddleware: false,  // "local", "proxy", "off" or falsy
      clientDir: null,          // when `staticMiddleware` is "local"
      staticPrefix: "/s/",      // when `staticMiddleware` is "local" or "proxy"
      serverUrl: null           // when `staticMiddleware` is "proxy"
    }, gourmet.baseOptions, baseOptions, options);

    const {staticMiddleware, clientDir, staticPrefix} = options;
    let ss;

    if (staticMiddleware === "local") {
      if (!clientDir)
        throw Error("`clientDir` is required when `staticMiddleware` is \"local\"");
      const serve = require("serve-static")(clientDir, {fallthrough: false, index: false, redirect: false});
      ss = (req, res, next) => {
        const orgUrl = req.url;
        req.url = req.url.substr(staticPrefix.length - 1);  // include leading "/"
        serve(req, res, err => {
          if (err && err.code === "ENOENT") {
            err = Error("Not found: " + req.url);
            err.statusCode = 404;
          }
          req.url = orgUrl;
          next(err);
        });
      };
    } else if (staticMiddleware === "proxy") {
      ss = (req, res, next) => {
        const reqOpts = gourmet.getReqOpts(options);
        reqOpts.path = req.originalUrl || req.url;
        webProxy(req, res, reqOpts, {
          handleError: next
        });
      };
    }

    return (req, res, next) => {
      res.serve = function(page, clientProps, context) {
        context = merge.intact({clientProps, reqArgs: getReqArgs(req)}, context);
        const opts = merge.intact(options, {page, context});
        gourmet.invoke(opts, (err, result) => {
          if (err) {
            next(err);
          } else if (!result) {
            next();
          } else {
            sendContent(res, result, err => {
              if (err)
                next(err);
            });
          }
        });
      };

      if (ss && req.url.indexOf(staticPrefix) === 0) {
        ss(req, res, next);
      } else {
        next();
      }
    };
  };
};
