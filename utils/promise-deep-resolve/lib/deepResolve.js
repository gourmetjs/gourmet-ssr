"use strict";

const repeat = require("promise-box/lib/repeat");
const forEach = require("promise-box/lib/forEach");
const isPromise = require("promise-box/lib/isPromise");
const isPlainObject = require("@gourmet/is-plain-object");

module.exports = function deepResolve(value) {
  function _resolve(value) {
    if (!isPromise(value))
      value = Promise.resolve(value);
    return value.then(value => {
      if (isPlainObject(value))
        return _resolveObject(value);
      else if (Array.isArray(value))
        return _resolveArray(value);
      else
        return value;
    });
  }

  function _resolveObject(obj) {
    const des = {};
    const props = Object.keys(obj);
    return forEach(props, prop => {
      return _resolve(obj[prop]).then(value => {
        des[prop] = value;
      });
    }).then(() => des);
  }

  function _resolveArray(arr) {
    const des = [];
    let index = 0;
    return repeat(() => {
      if (index >= arr.length)
        return des;
      return _resolve(arr[index]).then(value => {
        des.push(value);
        index++;
      });
    });
  }

  return _resolve(value);
};
