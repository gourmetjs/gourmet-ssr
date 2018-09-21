"use strict";

exports.console = console;
exports.global = global;
exports.process = process;
exports.__filename = __filename;
exports.__dirname = __dirname;
exports.Buffer = Buffer;
exports.setImmediate = setImmediate;
exports.path = require("path");
exports.url = require("url");
if (SERVER) {
  exports.fs = require("fs");
}
