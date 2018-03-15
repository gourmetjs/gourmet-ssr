"use strict";

const isPromise = require("promise-box/lib/isPromise");
const forEach = require("promise-box/lib/forEach");
const error = require("@gourmet/error");
const isPlainObject = require("@gourmet/is-plain-object");

const INVALID_PATH = {
  message: "Invalid path '${path}'",
  code: "INVALID_PATH"
};

const PROPERTY_NOT_FOUND = {
  message: "Property '${prop}' doesn't exist",
  code: "PROPERTY_NOT_FOUND"
};

const INVALID_INDEX_VALUE = {
  message: "Array index must be a number: '${index}' of '${path}'",
  code: "INVALID_INDEX_VALUE"
};

const INDEX_OUT_OF_RANGE = {
  message: "Array index out of range: '${index}' of '${path}'",
  code: "INDEX_OUT_OF_RANGE"
};

const OBJECT_OR_ARRAY_REQUIRED = {
  message: "Object or array required to access a property '${prop}'",
  code: "OBJECT_OR_ARRAY_REQUIRED"
};

module.exports = function deepProp(obj, path, handler, {strict}) {
  const props = path ? path.split(".") : [];
  let value = obj;

  return forEach(props, prop => {
    if (!prop)
      throw error(INVALID_PATH, {path});

    if (isPlainObject(value)) {
      if (!value.hasOwnProperty(prop)) {
        if (strict) {
          throw error(PROPERTY_NOT_FOUND, {path, prop});
        } else {
          value = undefined;
          return false;
        }
      }
    } else if (Array.isArray(value)) {
      const index = Number(prop);
      if (Number.isNaN(index))
        throw error(INVALID_INDEX_VALUE, {path, index});
      if (strict && (index < 0 || index >= value.length))
        throw error(INDEX_OUT_OF_RANGE, {path, index});
      prop = index;
    } else {
      throw error(OBJECT_OR_ARRAY_REQUIRED, {path, prop});
    }

    const parent = value;
    value = value[prop];

    let res = handler(value, prop, parent);
    if (!isPromise(res))
      res = Promise.resolve(res);
    return res.then(val => {
      value = val;
    });
  }).then(() => value);
};
