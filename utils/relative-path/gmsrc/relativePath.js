"use strict";

const npath = require("path");

module.exports = function relativePath(path, baseDir, {dot=true, cut=true}={}) {
  let check, idx;

  if (cut && (idx = path.indexOf("?")) !== -1)
    path = path.substr(0, idx);

  if (baseDir)
    path = npath.relative(baseDir, path);

  if (dot && !npath.isAbsolute(path))
    check = true;

  path = path.replace(/\\/g, "/");

  if (check && !path.startsWith("./") && !path.startsWith("../"))
    path = "./" + path;

  return path;
};
