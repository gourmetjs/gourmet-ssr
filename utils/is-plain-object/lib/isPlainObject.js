"use strict";

module.exports = function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
};
