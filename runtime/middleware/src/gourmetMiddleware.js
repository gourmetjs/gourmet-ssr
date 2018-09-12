"use strict";

const merge = require("@gourmet/merge");

module.exports = function factory(gourmet, baseOptions) {
  return function createMiddleware(options) {
    gourmet.baseOptions = options = merge.intact({
      staticMiddleware: false,  // "local", "proxy", "off" or falsy
      clientDir: null,          // when `staticMiddleware` is "local"
      staticPrefix: "/s/",      // when `staticMiddleware` is "local" or "proxy"
      serverUrl: null           // when `staticMiddleware` is "proxy"
    }, gourmet.baseOptions, baseOptions, options);

    const {staticMiddleware, clientDir} = options;

    const handlers = [];

    if (staticMiddleware === "local") {
      if (!clientDir)
        throw Error("`clientDir` is required when `staticMiddleware` is \"local\"");
      if (options.watch)
        handlers.push(require("./watch")(gourmet, options));
      else
        handlers.push(require("./static")(gourmet, options));
    } else if (staticMiddleware === "proxy") {
      handlers.push(require("./proxy")(gourmet, options));
    }

    handlers.push(require("./serve")(gourmet, options));

    return (req, res, out) => {
      let idx = 0;

      function next(err) {
        if (err)
          return out(err);

        const handler = handlers[idx++];

        if (handler)
          handler(req, res, next);
        else
          out();
      }

      next();
    };
  };
};
