"use strict";

const getReqArgs = require("@gourmet/get-req-args");
const sendContent = require("@gourmet/send-content");

module.exports = function factory(gourmet, options={}) {
  return function createMiddleware({serverDir, clientDir, staticPrefix}) {
    let ss;

    if (options.serveStatic === undefined || options.serveStatic) {
      const serveStatic = require("serve-static");
      ss = serveStatic(clientDir, {index: false, redirect: false});
    }

    return (req, res, next) => {
      res.serve = function(page, clientProps, context) {
        const args = Object.assign({
          serverDir,
          page,
          clientProps,
          reqArgs: getReqArgs(req)
        }, context);

        gourmet.invoke(args, (err, result) => {
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
