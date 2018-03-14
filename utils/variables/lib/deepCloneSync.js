"use strict";

const isPlainObject = require("@gourmet/is-plain-object");

module.exports = function deepCloneSync(value, handler) {
  function _clone(value) {
    const res = handler(value);
    if (isPlainObject(res))
      return _cloneObject(res);
    else if (Array.isArray(res))
      return _cloneArray(res);
    else
      return res;
  }

  function _cloneObject(obj) {
    const des = {};
    const props = Object.keys(obj);
    props.forEach(prop => {
      const value = obj[prop];
      des[prop] = _clone(value);
    });
    return des;
  }

  function _cloneArray(arr) {
    const des = [];
    for (let index = 0; index < arr.length; index++) {
      const value = arr[index];
      des.push(_clone(value));
    }
    return des;
  }

  return _clone(value);
};
