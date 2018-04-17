"use strict";

const promiseDeepProp = require("@gourmet/promise-deep-prop");

class ContextSource {
  constructor(context) {
    this._context = context;
  }

  resolve(vars, info) {
    return promiseDeepProp(this._context, info.path, value => value);
  }
}

module.exports = ContextSource;
