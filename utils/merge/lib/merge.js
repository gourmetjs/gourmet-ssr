"use strict";

class Customizer {
  constructor(customizer) {
    this.customizer = customizer;
  }
}

const OBJECT = 1;
const ARRAY = 2;
const OTHER = 0;

function _getType(obj) {
  const name = obj && typeof obj === "object"
      && typeof obj.constructor === "function"
      && obj.constructor.name;
  if (name === "Object")
    return OBJECT;
  else if (name === "Array")
    return ARRAY;
  return OTHER;
}

function _isPlainObject(obj) {
  return _getType(obj) === OBJECT;
}

function _isArray(arr) {
  return _getType(arr) === ARRAY;
}

function _merge(des, src) {
  for (const prop in src) {
    let srcVal;

    if (src.hasOwnProperty(prop) && (srcVal = src[prop]) !== undefined) {
      const desVal = des[prop];
      let newVal;

      if (srcVal instanceof Customizer)
        newVal = srcVal.customizer.call(null, desVal);

      if (newVal === undefined) {
        const st = _getType(srcVal);
        const dt = _getType(desVal);

        if (dt === ARRAY)
          newVal = desVal.concat(srcVal);
        else if (st === ARRAY)
          newVal = [desVal].concat(srcVal);
        else if (st === OBJECT && dt === OBJECT)
          newVal = _merge(desVal, srcVal);
        else if (st === OBJECT)
          newVal = _merge({}, srcVal);  // make a copy
        else
          newVal = srcVal;
      }

      des[prop] = newVal;
    }
  }

  return des;
}

/**
 * Recursively merges source objects into the destination object in-place.
 * Key behaviors are:
 *  - Arrays are appended.
 *  - Non-plain objects (class instances) are ref-copied, not cloned.
 *  - Customizers are supported through `merge.custom`.
 **/
function merge(des, ...args) {
  for (let idx = 0, len = args.length; idx < len; idx++) {
    const src = args[idx];
    if (_isPlainObject(src))
      _merge(des, src);
  }
  return des;
}

// `customizer` will get called with a parameter `des` which is a destination
// value to be merged with. Note this can be `undefined` if there is no
// destination value. If returns `undefined`, the default method is used.
merge.custom = function(customizer) {
  return new Customizer(customizer);
};

// A customizer to assign a value to destination without any operation.
// Can be used to replace, not to append an array.
merge.assign = function(value) {
  return new Customizer(function() {
    return value;
  });
};

// Merges objects into a new object, keeping source objects intact.
// This function tries to minimize unnecessary copying whenever possible.
// Also, note that this function returns `undefined` if there is no plain
// object in the arguments.
merge.intact = function(...args) {
  let des;

  for (let idx = 0, len = args.length; idx < len; idx++) {
    const src = args[idx];
    if (_isPlainObject(src)) {
      if (!des) {
        des = src;
      } else if (des.__safeToWrite__) {
        merge(des, src);
      } else {
        const obj = {};
        Object.defineProperty(obj, "__safeToWrite__", {value: true});
        des = merge(obj, des, src);
      }
    }
  }

  return des;
};

// Utilities for customizers
merge.isPlainObject = _isPlainObject;
merge.isArray = _isArray;

module.exports = merge;
