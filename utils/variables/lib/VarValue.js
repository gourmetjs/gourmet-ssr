"use strict";

const promiseWrap = require("@gourmet/promise-wrap");
const VarNode = require("./VarNode");

class VarValue extends VarNode {
  constructor(value) {
    super();
    this._value = value;
  }

  resolve() {
    return promiseWrap(this._value);
  }
}

module.exports = VarValue;
