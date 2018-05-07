"use strict";

const nurl = require("url");

module.exports = function getReqArgs(req) {
  function _url() {
    if (!parsedUrl)
      parsedUrl = nurl.parse(req.url, true);
    return parsedUrl;
  }

  let parsedUrl;

  return {
    method: req.method,
    headers: req.headers,
    path: typeof req.path === "string" ? req.path : _url().pathname,
    query: typeof req.query === "object" ? req.query : _url().query,
    encrypted: req.socket.encrypted
  };
};
