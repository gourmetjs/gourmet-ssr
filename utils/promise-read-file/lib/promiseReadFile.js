"use strict";

const fs = require("fs");

module.exports = function promiseReadFile(path, opts="utf8") {
  return new Promise((resolve, reject) => {
    fs.readFile(path, opts, (err, data) => {
      if (err)
        return reject(err);
      resolve(data);
    });
  });
};
