"use strict";

const fs = require("fs");
const npath = require("path");
const getReqArgs = require("@gourmet/get-req-args");
const sendContent = require("@gourmet/send-content");
const merge = require("@gourmet/merge");

module.exports = function factory(gourmet, baseOptions) {
  return function createMiddleware(options) {
    gourmet.baseOptions = options = merge.intact({
      serveStatic: "local",   // "local", "proxy", "off" or falsy
      clientDir: null,        // when `serveStatic` is "local"
      serverDir: null,        // (when `serveStatic` is "local" or "proxy") and (when `staticPrefix` is empty)
      staticPrefix: null      // when `serveStatic` is "local" or "proxy"
    }, gourmet.baseOptions, baseOptions, options);

    let {serveStatic, staticPrefix, serverDir, clientDir} = options;
    let ss;

    if (serveStatic === "local" || serveStatic === "proxy") {
      if (!staticPrefix) {
        if (!serverDir)
          throw Error("`serverDir` is required to load manifest file when `staticPrefix` is not specified");
        const path = npath.join(serverDir, "manifest.json");
        const manifest = JSON.parse(fs.readFileSync(path, "utf8"));
        staticPrefix = manifest.staticPrefix;
        if (!staticPrefix)
          throw Error("Invalid manifest file, no `staticPrefix` inside: " + path);
      }
    }

    if (serveStatic === "local") {
      if (!clientDir)
        throw Error("`clientDir` is required when `serveStatic` is \"local\"");
      const serveStatic = require("serve-static");
      ss = serveStatic(clientDir, {index: false, redirect: false});
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
        const orgUrl = req.url;
        req.url = req.url.substr(staticPrefix.length - 1);  // include leading "/"
        ss(req, res, err => {
          req.url = orgUrl;
          next(err);
        });
      } else {
        next();
      }
    };
  };
};
