"use strict";

const promiseProtect = require("@gourmet/promise-protect");
const Router = require("./Router");
const ActiveRoute = require("./ActiveRoute");
const Link = require("./Link");

class ServerRouter extends Router {
  getTargetHref(gmctx) {
    return gmctx.reqArgs.url;
  }
}

// - basePath: Default is `"/"`.
// - caseSensitive: Default is `true`.
// - strictSlash: Default is `false`.
function i80(routes, options) {
  return ServerRouter.create(routes, options);
}

i80.ActiveRoute = ActiveRoute;
i80.Link = Link;
i80.getUrl = (...args) => Router.get().getUrl(...args);

module.exports = i80;
