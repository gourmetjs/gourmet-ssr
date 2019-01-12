"use strict";

const isPlainObject = require("@gourmet/is-plain-object");
const promiseSync = require("@gourmet/promise-sync");
const promiseWrap = require("@gourmet/promise-wrap");
const promiseEach = require("@gourmet/promise-each");
const promiseMap = require("@gourmet/promise-map");

// Handler should return a source value.
module.exports = function promiseDeepClone(value, path, handler) {
  function _clone(value, prop, parent, path) {
    return promiseSync(handler(value, prop, parent, path), value => {
      if (isPlainObject(value))
        return _cloneObject(value, path);
      else if (Array.isArray(value))
        return _cloneArray(value, path);
      else
        return value;
    });
  }

  function _cloneObject(obj, path) {
    const des = {};
    const props = Object.keys(obj);
    return promiseEach(props, prop => {
      return promiseSync(_clone(obj[prop], prop, obj, path + "." + prop), value => {
        des[prop] = value;
      });
    }).then(() => des);
  }

  function _cloneArray(arr, path) {
    return promiseMap(arr, (value, index) => {
      return _clone(value, index, arr, path + "." + index);
    });
  }

  return promiseWrap(_clone(value, null, null, path));
};
