"use strict";

const isPlainObject = require("@gourmet/is-plain-object");

class Customizer {
  constructor(customizer) {
    this.customizer = customizer;
  }
}

const OBJECT = 1;
const ARRAY = 2;
const OTHER = 0;

function _getType(obj) {
  if (isPlainObject(obj))
    return OBJECT;
  else if (Array.isArray(obj))
    return ARRAY;
  return OTHER;
}

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

/**
 * Recursively merges source objects into the destination object in-place.
 * Key behaviors are:
 *  - Arrays are appended.
 *  - Non-plain objects (class instances) are ref-copied, not cloned.
 *  - Customizers are supported through `merge.custom`.
 **/
function merge(des, ...values) {
  for (let idx = 0, len = values.length; idx < len; idx++) {
    const value = values[idx];
    if (value !== undefined) {
      if (value instanceof Customizer) {
        des = value.customizer.call(null, des);
      } else {
        const st = _getType(value);
        const dt = _getType(des);
        if (dt === ARRAY) {
          if (st === ARRAY)
            des.push(...value);
          else
            des.push(value);
        } else if (st === ARRAY) {
          if (des !== undefined)
            des = [des].concat(value);
          else
            des = [].concat(value);
        } else if (st === OBJECT) {
          if (dt === OBJECT)
            _mergeObj(des, value);
          else
            des = _mergeObj({}, value);
        } else {
          des = value;
        }
      }
    }
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

module.exports = merge;
