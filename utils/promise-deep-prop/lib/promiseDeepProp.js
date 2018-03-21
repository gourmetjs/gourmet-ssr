"use strict";

const isPlainObject = require("@gourmet/is-plain-object");
const promiseSync = require("@gourmet/promise-sync");
const promiseEach = require("@gourmet/promise-each");
const error = require("@gourmet/error");

const INVALID_PATH = {
  message: "Invalid path '${path}'",
  code: "INVALID_PATH"
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

module.exports = function promiseDeepProp(obj, path, handler) {
  const props = path ? path.split(".") : [];
  let value = obj;

  return promiseEach(props, prop => {
    if (!prop)
      throw error(INVALID_PATH, {path});

    if (isPlainObject(value)) {
      if (!value.hasOwnProperty(prop)) {
        value = undefined;
        return false; // exit the loop
      }
    } else if (Array.isArray(value)) {
      const index = Number(prop);
      if (Number.isNaN(index))
        throw error(INVALID_INDEX_VALUE, {path, index});
      if (index < 0 || index >= value.length)
        throw error(INDEX_OUT_OF_RANGE, {path, index});
      prop = index;
    } else {
      throw error(OBJECT_OR_ARRAY_REQUIRED, {path, prop});
    }

    const parent = value;
    value = value[prop];

    return promiseSync(handler(value, prop, parent), val => {
      value = val;
    });
  }).then(() => value);
};
