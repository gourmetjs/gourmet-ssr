"use strict";

const isPlainObject = require("@gourmet/is-plain-object");

function _mergeObj(des, src) {
  const props = Object.keys(src);
  for (let idx = 0; idx < props.length; idx++) {
    const prop = props[idx];
    const value = merge(undefined, des[prop], src[prop]);
    if (value !== undefined)
      des[prop] = value;
  }
  return des;
}

function merge(des, ...values) {
  for (let idx = 0; idx < values.length; idx++) {
    const value = values[idx];
    if (value !== undefined) {
      if (isPlainObject(value)) {
        if (isPlainObject(des))
          _mergeObj(des, value);
        else
          des = _mergeObj({}, value);
      } else {
        des = value;
      }
    }
  }
  return des;
}

module.exports = merge;
