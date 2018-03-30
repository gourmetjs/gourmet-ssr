"use strict";

const npath = require("path");
const resolve = require("resolve");

module.exports = function moduleDir(basedir) {
  return function(name) {
    const path = resolve.sync(name + "/package.json", {basedir});
    return npath.dirname(path);
  };
};
