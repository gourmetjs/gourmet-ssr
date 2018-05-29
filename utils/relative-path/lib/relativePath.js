"use strict";

const npath = require("path");

module.exports = function relativePath(path, baseDir, dot=true) {
  if (baseDir)
    path = npath.relative(baseDir, path);

  if (dot && !npath.isAbsolute(path) && path[0] !== ".")
    path = "./" + path;

  return path.replace(/\\/g, "/");
};
