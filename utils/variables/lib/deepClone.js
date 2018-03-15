"use strict";

const repeat = require("promise-box/lib/repeat");
const forEach = require("promise-box/lib/forEach");
const isPromise = require("promise-box/lib/isPromise");
const isPlainObject = require("@gourmet/is-plain-object");

// Handler should return a source value.
module.exports = function deepClone(value, path, handler) {
  function _clone(value, prop, parent, path) {
    let res = handler(value, prop, parent, path);
    if (!isPromise(res))
      res = Promise.resolve(res);
    return res.then(value => {
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
    return forEach(props, prop => {
      return _clone(obj[prop], prop, obj, path + "." + prop).then(value => {
        des[prop] = value;
      });
    }).then(() => des);
  }

  function _cloneArray(arr, path) {
    const des = [];
    let index = 0;
    return repeat(() => {
      if (index >= arr.length)
        return des;
      return _clone(arr[index], index, arr, path + "." + index).then(value => {
        des.push(value);
        index++;
      });
    });
  }

  return _clone(value, null, null, path);
};
