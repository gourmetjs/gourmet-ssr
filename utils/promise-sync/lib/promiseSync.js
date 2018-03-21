"use strict";

const isPromise = require("@gourmet/is-promise");

module.exports = function promiseSync(value, handler) {
  if (isPromise(value))
    return value.then(value => handler(value));
  else
    return handler(value);
};
