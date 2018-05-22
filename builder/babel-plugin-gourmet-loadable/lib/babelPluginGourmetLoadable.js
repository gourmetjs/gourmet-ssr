"use strict";

const util = require("util");

module.exports = function babelPluginGourmetLoadable(babel) {
  return {
    visitor: {
      Import(path, state) {
        console.log(util.inspect(state.file.opts.filename, {depth: 0, colors: true}));
      }
    }
  };
};
