"use strict";

class Customizer {
  constructor(customizer) {
    this.customizer = customizer;
  }
}

function _isPlainObject(obj) {
  return obj && typeof obj === "object"
      && typeof obj.constructor === "function"
      && obj.constructor.name === "Object";
}

function _isArray(arr) {
  return arr && typeof arr === "object"
      && typeof arr.constructor === "function"
      && arr.constructor.name === "Array";
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
        if (_isPlainObject(srcVal)) {
          if (_isPlainObject(desVal))
            newVal = _merge(desVal, srcVal);
          else
            newVal = _merge({}, srcVal);  // make a deep copy
        } else if (_isArray(srcVal)) {
          if (_isArray(desVal))
            newVal = desVal.concat(srcVal);
          else
            newVal = [].concat(srcVal);   // make a shallow copy
        } else {
          newVal = srcVal;
        }
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
