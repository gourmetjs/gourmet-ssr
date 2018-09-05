"use strict";

const ProxyHeaders = require("@gourmet/proxy-headers");

module.exports = function getReqArgs(req) {
  return {
    url: req.originalUrl || req.url,
    method: req.method,
    headers: new ProxyHeaders(req).getHeaders(),
    encrypted: req.socket.encrypted
  };
};
