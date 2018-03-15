"use strict";

class Opt {
  constructor(options) {
    this._options = options;
  }

  resolve(info) {
    return this._options[info.path];
  }
}

module.exports = Opt;
