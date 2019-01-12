"use strict";

const promiseRepeat = require("@gourmet/promise-repeat");
const promiseSync = require("@gourmet/promise-sync");

module.exports = function promiseMap(arr, handler) {
  const items = new Array(arr.length);
  let idx = 0;

  return promiseRepeat(() => {
    if (idx >= arr.length)
      return items;

    const pos = idx++;
    const value = handler(arr[pos], pos);

    return promiseSync(value, value => {
      items[pos] = value;
    });
  });
};
