"use strict";

module.exports = function isStream(obj) {
  return obj && typeof obj === "object" && typeof obj.pipe === "function";
};
