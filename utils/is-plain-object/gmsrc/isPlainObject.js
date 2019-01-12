"use strict";

const toString = Object.prototype.toString;
const objProto = Object.getPrototypeOf({});

module.exports = function isPlainObject(obj) {
  if (toString.call(obj) === "[object Object]") {
    const proto = Object.getPrototypeOf(obj);
    return proto === null || proto === objProto;
  }
  return false;
};
