"use strict";

const serializeError = require("@gourmet/serialize-error");

const INDENTATION_SIZE = 2;

function _inspect(obj, indent) {
  return Object.keys(obj).map(prop => {
    let value = obj[prop];

    if (value) {
      if (prop === "stack" && typeof value === "string") {
        value = value.split("\n").map((item, idx) => {
          return idx ? " ".repeat(indent * INDENTATION_SIZE) + item : item;
        }).join("\n");
      } else if (typeof value === "object") {
        value = "\n" + _inspect(value, indent + 1);
      }
    }

    return " ".repeat(indent * INDENTATION_SIZE) + prop + ": " + value;
  }).join("\n");
}

module.exports = function inspectError(err, indent) {
  return _inspect(serializeError(err), indent || 0);
};
