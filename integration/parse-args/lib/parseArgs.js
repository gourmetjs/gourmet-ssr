"use strict";

const undef = {};

// Value can be an array of aliased options as in `[argv.verbose, argv.v]`.
// Use this in case you accept zero, empty string or null as a valid input
// for aliased options where you cannot simply use `argv.verbose || argv.v`.
function _value(value) {
  if (Array.isArray(value)) {
    for (let idx = 0; idx < value.length; idx++) 
      if (value[idx] !== undefined)
        return value[idx];
    return undefined;
  } else {
    return value;
  }
}

function bool(value, defVal=false) {
  value = _value(value);
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
  value = _value(value);
  if (value !== undefined) {
    value = parseInt(value, 10);
    if (value === value)    // !NaN
      return value;
  }
  return defVal === undef ? undefined : defVal;
}

function verbosity(value, defVal="log") {
  value = _value(value);
  if (value !== undefined) {
    if (typeof value === "number")
      return 6 - value;
    if (typeof value === "string") {
      const n = parseInt(value, 10);
      if (n === n)  // !NaN
        return 6 - n;
      if (value === "off")
        return 6;
      return value;
    }
  }
  return defVal === undef ? undefined : defVal;
}

function string(value, defVal="") {
  value = _value(value);
  if (value !== undefined) {
    if (value || value !== value)   // value !== value for NaN
      return value.toString();
    return value;
  }
  return defVal === undef ? undefined : defVal;
}

module.exports = {
  bool,
  number,
  string,
  verbosity,
  undef
};
