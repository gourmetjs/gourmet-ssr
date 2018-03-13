"use strict";

const forEach = require("promise-box/lib/forEach");
const error = require("@gourmet/error");
const isPlainObject = require("@gourmet/is-plain-object");

const INVALID_PATH = {
  message: "Invalid path '${path}'",
  code: "INVALID_PATH"
};

const PROPERTY_NOT_FOUND = {
  message: "Property '${prop}' of '${path}' doesn't exist",
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
  message: "Must be an object or array: '${prop}' of '${path}'",
  code: "OBJECT_OR_ARRAY_REQUIRED"
};

module.exports = function deepProp(obj, path, customizer, {strict}) {
  const props = path ? path.split(".") : [];
  let value = obj;

  return forEach(props, prop => {
    if (!prop)
      throw error(INVALID_PATH, {path});

    if (isPlainObject(value)) {
      if (strict && !value.hasOwnProperty(prop))
        throw error(PROPERTY_NOT_FOUND, {path, prop});
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

    return customizer(value, prop, parent).then(val => {
      value = val;
    });
  });
};
