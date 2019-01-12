"use strict";

const WebProxy = require("./WebProxy");

module.exports = function webProxy(req, res, target, options) {
  const proxy = new WebProxy(options);
  proxy.handle(req, res, target);
  return proxy;
};
