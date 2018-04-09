"use strict";

const tty = require("tty");

module.exports = function detect(options) {
  options = Object.assign({}, options);
  if (options.useColors === undefined)
    options.useColors = process.env.DEBUG_COLORS ? true : tty.isatty(process.stdout.fd);
  if (options.minLevel === undefined)
    options.minLevel = process.env.DEBUG_LEVEL || "log";
  if (options.namespaces === undefined)
    options.namespaces = process.env.DEBUG || "*";
  return options;
};
