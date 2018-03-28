"use strict";

const fs = require("fs");

module.exports = function promiseReadFile(path, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err, data) => {
      if (err)
        return reject(err);
      resolve(data);
    });
  });
};
