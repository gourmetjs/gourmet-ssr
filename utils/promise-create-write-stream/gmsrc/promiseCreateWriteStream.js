"use strict";

const fs = require("fs");
const util = require("util");
const npath = require("path");
const mkdirp = require("mkdirp");

const promiseRename = util.promisify(fs.rename);

module.exports = function promiseCreateWriteStream(path, callback, options) {
  const orgPath = path;

  if (typeof options === "string")
    options = {encoding: options};
  else if (!options)
    options = {};

  return new Promise(function(resolve, reject) {
    function createStream() {
      const ws = fs.createWriteStream(path, options);
      ws.once("open", function() {
        this.once("finish", resolve).once("error", reject);
        try {
          callback(this);
        } catch (err) {
          this.removeAllListeners();
          this.end();
          reject(err);
        }
      });
      return ws;
    }

    if (!options.useOriginalPath)
      path = orgPath + ".saving";

    createStream().once("error", function(err) {
      if (!options.dontMakeDirs && err && err.code === "ENOENT") {
        const mode = options.mkdirMode || 0x1ff;
        mkdirp(npath.dirname(path), mode, function(err) {
          if (!err) {
            createStream().once("error", reject);
          } else {
            reject(err);
          }
        });
      } else {
        reject(err);
      }
    });
  }).then(function() {
    if (!options.useOriginalPath)
      return promiseRename(path, orgPath);
  });
};
