"use strict";

const promiseWrap = require("@gourmet/promise-wrap");
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

    return promiseWrap(handler(vars.handlerContext));
  }
}

module.exports = VarGetter;
