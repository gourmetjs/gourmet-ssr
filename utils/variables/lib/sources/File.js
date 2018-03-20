"use strict";

const npath = require("path");
const isPromise = require("promise-box/lib/isPromise");
const deepProp = require("../deepProp");

class File {
  constructor(workDir) {
    this.workDir = workDir;
  }

  resolve(vars, info) {
    const path = npath.resolve(this.workDir, info.path);

    let value = require(path);

    if (typeof value === "function")
      value = value(vars.handlerContext);

    if (!isPromise(value))
      value = Promise.resolve(value);

    return value.then(value => {
      if (info.query.property)
        return deepProp(value, info.query.property, value => value);
      return value;
    }).then(value => {
      if (value !== undefined)
        return vars.prepareValue(value);
      else
        return value;
    });
  }
}

module.exports = File;
