"use strict";

const npath = require("path");
const promiseWrap = require("@gourmet/promise-wrap");
const promiseDeepProp = require("@gourmet/promise-deep-prop");

class File {
  constructor(workDir) {
    this.workDir = workDir;
  }

  resolve(vars, info) {
    const path = npath.resolve(this.workDir, info.path);

    let value = require(path);

    if (typeof value === "function")
      value = value(vars.handlerContext);

    return promiseWrap(value).then(value => {
      if (info.query.property)
        return promiseDeepProp(value, info.query.property, value => value);
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
