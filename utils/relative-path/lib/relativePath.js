"use strict";

const npath = require("path");

module.exports = function relativePath(path, baseDir, dot=true) {
  let check;

  if (baseDir)
    path = npath.relative(baseDir, path);

  if (dot && !npath.isAbsolute(path))
    check = true;

  path = path.replace(/\\/g, "/");

  if (check && !path.startsWith("./") && !path.startsWith("../"))
    path = "./" + path;

  return path;
};
