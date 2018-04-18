"use strict";

const undef = {};

function bool(value, defVal=false) {
  if (value !== undefined) {
    if (typeof value === "boolean")
      return value;
    if (value === "false" || value === "off" || value === "0" || value === 0 || value === "")
      return false;
    if (value === "true" || value === "on" || value === "1" || typeof value === "number" || typeof value === "string")
      return true;
  }
  return defVal === undef ? undefined : defVal;
}

function number(value, defVal=0) {
  if (value !== undefined) {
    value = parseInt(value, 10);
    if (value === value)    // !NaN
      return value;
  }
  return defVal === undef ? undefined : defVal;
}

function verbosity(value, defVal="log") {
  if (value !== undefined) {
    if (typeof value === "number")
      return value;
    if (typeof value === "string") {
      const n = parseInt(value, 10);
      if (n === n)  // !NaN
        return n;
      return value;
    }
  }
  return defVal === undef ? undefined : defVal;
}

module.exports = {
  bool,
  number,
  verbosity,
  undef
};
