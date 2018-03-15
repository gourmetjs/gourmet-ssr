"use strict";

const npath = require("path");
const isPromise = require("promise-box/lib/isPromise");
const deepProp = require("../deepProp");

class File {
  constructor(vars, workDir, userCtx) {
    this._vars;
    this._workDir = workDir;
    this._userCtx = userCtx;
  }

  resolve(info) {
    const path = npath.resolve(this._workDir, info.path);

    let value = require(path);

    if (typeof value === "function")
      value = value(this._userCtx);

    if (!isPromise(value))
      value = Promise.resolve(value);

    return value.then(value => {
      if (info.query.property)
        return deepProp(value, info.query.property, value => value);
      return value;
    }).then(value => {
      if (value !== undefined)
        return this._vars.prepareValue(value);
      else
        return value;
    });
  }
}

module.exports = File;
