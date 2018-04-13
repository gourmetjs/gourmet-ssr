"use strict";

const isPlainObject = require("@gourmet/is-plain-object");
const isStream = require("@gourmet/is-stream");

module.exports = function sendContent(res, {statusCode=200, headers={}, content}) {
  function _has(key) {
    key = key.toLowerCase();
    return keys.indexOf(key) !== -1;
  }

  let type = "text/html; charset=utf-8";
  let len;

  if (!content) {
    content = "";
    len = 0;
  } else if (typeof content === "string") {
    content = Buffer.from(content);
    len = content.length;
  } else if (Buffer.isBuffer(content)) {
    len = content.length;
  } else if (isPlainObject(content)) {
    type = "application/json";
    content = Buffer.from(JSON.stringify(content));
    len = content.length;
  } else if (!isStream(content)) {
    throw Error("'content' must be a string, buffer, object or stream");
  }

  const keys = Object.keys(headers).map(key => key.toLowerCase());

  if (!_has("content-type"))
    headers["content-type"] = type;

  if (len !== undefined && !_has("content-length"))
    headers["content-length"] = len;

  res.writeHead(statusCode || 200, headers);

  if (isStream(content)) {
    content.pipe(res);
    content.once("error", err => {
      // The 'error' event on source stream is not forwarded to the destination
      // stream automatically. We destroy the `res` object's underlying socket
      // to prevent reuse of it in case of streaming error.
      res.destroy(err);
    });
  } else {
    res.end(content);
  }
};
