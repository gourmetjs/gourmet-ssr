"use strict";

const isPromise = require("@gourmet/is-promise");

// Unique signature to exit the loop with `undefined`.
const UNDEFINED = function() {};

function promiseRepeat(handler) {
  return new Promise(function(resolve, reject) {
    function _proceed() {
      let value;

      try {
        value = handler();
      } catch (err) {
        return reject(err);
      }

      if (isPromise(value)) {
        value.then(function(value) {
          if (value === undefined)
            _next();
          else
            resolve(value === UNDEFINED ? undefined : value);
        }, reject);
      } else {
        if (value === undefined)
          _next();
        else
          resolve(value === UNDEFINED ? undefined : value);
      }
    }

    function _next() {
      // TODO: enhance performance by calling `_proceed()` directly when possible.
      setImmediate(_proceed);
    }

    _next();
  });
}

promiseRepeat.UNDEFINED = UNDEFINED;

module.exports = promiseRepeat;
