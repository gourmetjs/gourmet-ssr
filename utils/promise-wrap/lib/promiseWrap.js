"use strict";

const isPromise = require("is-promise");

module.exports = function promiseWrap(value) {
  if (isPromise(value))
    return value;
  return Promise.resolve(value);
};
