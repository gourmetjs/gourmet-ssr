"use strict";

module.exports = function sendContent(res, content, status, headers) {
  let type;

  switch (typeof content) {
    case "string":
      type = "text/html; charset=utf-8";
      content = Buffer.from(content);
      break;
    case "object":
      if (Buffer.isBuffer(content)) {
        type = "application/octet-stream";
      } else {
        type = "application/json";
        content = Buffer.from(JSON.stringify(content));
      }
      break;
    default:
      throw Error("'content' must be a string, buffer, object or array");
  }

  headers = Object.assign({
    "content-type": type,
    "content-length": content.length
  }, headers);

  res.writeHead(status || 200, headers);
  res.end(content);
};
