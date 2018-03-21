"use strict";

module.exports = function promiseMain(promise, waitForExit) {
  return promise.catch(err => {
    if (waitForExit) {
      console.error(err);
      process.on("exit", function() {
        process.exit(1);
      });
    } else {
      setImmediate(() => {
        throw err;
      });
    }
  });
};
