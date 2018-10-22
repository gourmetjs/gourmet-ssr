"use strict";

const isPlainObject = require("@gourmet/is-plain-object");

function _merge(des, src) {
  const props = Object.keys(src);

  for (let idx = 0; idx < props.length; idx++) {
    const prop = props[idx];
    const srcVal = src[prop];
    const desVal = des[prop];

    if (isPlainObject(desVal)) {
      if (isPlainObject(srcVal))
        des[prop] = _merge(desVal, srcVal);
      else
        des[prop] = _merge({}, srcVal);  // make a copy
    } else if (srcVal !== undefined) {
      des[prop] = srcVal;
    }
  }

  return des;
}

function merge(des, ...args) {
  if (!isPlainObject(des))
    throw Error("Not a plain object");
  for (let idx = 0, len = args.length; idx < len; idx++) {
    const src = args[idx];
    if (src) {
      if (!isPlainObject(src))
        throw Error("Not a plain object");
      _merge(des, src);
    }
  }
  return des;
}

module.exports = merge;
