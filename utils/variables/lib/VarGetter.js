"use strict";

const isPromise = require("promise-box/lib/isPromise");
const VarNode = require("./VarNode");

class VarGetter extends VarNode {
  constructor(handler) {
    super();
    this._handler = handler;
  }

  resolve(vars) {
    const handler = this._handler;

    if (typeof handler !== "function")
      throw Error("Getter must be a function");

    const value = handler(vars.handlerContext);

    if (!isPromise(value))
      return Promise.resolve(value);

    return value;
  }
}

module.exports = VarGetter;
