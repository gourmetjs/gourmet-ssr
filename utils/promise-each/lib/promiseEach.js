"use strict";

const promiseRepeat = require("@gourmet/promise-repeat");
const promiseSync = require("@gourmet/promise-sync");

function promiseEach(arr, handler) {
  let idx = 0;

  return promiseRepeat(() => {
    if (idx >= arr.length)
      return promiseRepeat.UNDEFINED;

    const pos = idx++;
    const value = handler(arr[pos], pos);

    return promiseSync(value, value => {
      if (value !== undefined)
        return value;
    });
  });
}

promiseEach.UNDEFINED = promiseRepeat.UNDEFINED;

module.exports = promiseEach;
