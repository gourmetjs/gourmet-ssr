"use strict";

const nurl = require("url");
const ProxyHeaders = require("@gourmet/proxy-headers");

module.exports = function getReqArgs(req) {
  function _url() {
    if (!parsedUrl)
      parsedUrl = nurl.parse(req.url, true);
    return parsedUrl;
  }

  let parsedUrl;

  return {
    method: req.method,
    headers: new ProxyHeaders(req).getHeaders(),
    path: typeof req.path === "string" ? req.path : _url().pathname,
    query: typeof req.query === "object" ? req.query : _url().query,
    encrypted: req.socket.encrypted
  };
};
