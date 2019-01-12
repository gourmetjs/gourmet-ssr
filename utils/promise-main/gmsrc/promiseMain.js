"use strict";

module.exports = function promiseMain(promise, gracefulExit) {
  return promise.catch(err => {
    if (gracefulExit) {
      console.error(err);
      process.exitCode = 1;
    } else {
      setImmediate(() => {
        throw err;
      });
    }
  });
};
