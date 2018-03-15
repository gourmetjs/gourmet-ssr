"use strict";

class Env {
  constructor(env) {
    this._env = env;
  }

  resolve(info) {
    return (this._env || process.env)[info.path];
  }
}

module.exports = Env;
