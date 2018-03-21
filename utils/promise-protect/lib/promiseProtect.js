"use strict";

module.exports = function promiseProtect(handler) {
  return new Promise(function(resolve, reject) {
    try {
      resolve(handler());
    } catch (err) {
      reject(err);
    }
  });
};
