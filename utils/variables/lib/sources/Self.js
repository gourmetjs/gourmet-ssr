"use strict";

class Self {
  constructor(vars) {
    this.vars = vars;
  }

  resolve(info, options) {
    return this.vars.get(info.path, options);
  }
}

module.exports = Self;
