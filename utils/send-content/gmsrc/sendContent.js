"use strict";

const con = require("@gourmet/console")();
const isPlainObject = require("@gourmet/is-plain-object");
const isStream = require("@gourmet/is-stream");
const inspectError = require("@gourmet/inspect-error");
const pump = require("pump");
const eos = require("end-of-stream");

function _defaultDone(err) {
  if (err)
    con.error(`Error in sendContent\n${inspectError(err, 1)}`);
}

// `callback(err)` is called when sending a stream is finished.
module.exports = function sendContent(res, {statusCode=200, headers={}, content}={}, callback=_defaultDone) {
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

  res.statusCode = statusCode || 200;

  Object.keys(headers).forEach(name => {
    const value = headers[name];
    res.setHeader(name, value);
  });

  if (isStream(content)) {
    pump(content, res, callback);
  } else {
    res.end(content);
    eos(res, callback);
  }
};
