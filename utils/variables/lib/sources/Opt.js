"use strict";

class Opt {
  constructor(options) {
    this._options = options;
  }

  resolve(vars, info) {
    return this._options[info.path];
  }
}

module.exports = Opt;
