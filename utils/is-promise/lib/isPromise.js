"use strict";

// Returns true if the object is a promise.
module.exports = function isPromise(obj) {
  return obj && typeof obj === "object" && typeof obj.then === "function";
};
