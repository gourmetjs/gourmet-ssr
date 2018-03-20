"use strict";

class Self {
  resolve(vars, info, options) {
    return vars.getNode(info.path, options);
  }
}

module.exports = Self;
