"use strict";

const promiseCreateWriteStream = require("@gourmet/promise-create-write-stream");

module.exports = function promiseWriteFile(path, data, options) {
  return promiseCreateWriteStream(path, function(ws) {
    ws.write(data);
    ws.end();
  }, options);
};
