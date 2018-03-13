"use strict";

const repeat = require("promise-box/lib/repeat");
const isPlainObject = require("@gourmet/is-plain-object");

module.exports = function deepScan(value, path, customizer) {
  function _scan(value, prop, parent, path) {
    return repeat(() => {
      wrap(() => customizer(value, prop, parent, path)).then(res => {
        if (isPlainObject(res))
          return _scanObject();
        else if (Array.isArray(res))
          return _scanArray();
      });
    });
  }
  return _scan(value, null, null, path);
};
