"use strict";

const fs = require("fs");
const util = require("util");
const promiseProtect = require("@gourmet/promise-protect");
const promiseReadFile = require("@gourmet/promise-read-file");
const promiseWriteFile = require("@gourmet/promise-write-file");

const promiseUnlink = util.promisify(fs.unlink);
const promiseAccess = util.promisify(fs.access);

function _copyFile(srcPath, desPath, {checkDes, deleteDes, ignoreSrc}={}) {
  return promiseProtect(() => {
    if (checkDes) {
      return promiseAccess(desPath).catch(err => {
        if (err.code === "ENOENT")
          return true;
      });
    } else {
      return true;
    }
  }).then(cont => {
    if (cont) {
      return promiseReadFile(srcPath).then(content => {
        return promiseWriteFile(desPath, content, {useOriginalPath: true});
      }, err => {
        if (err.code === "ENOENT") {
          if (deleteDes)
            return promiseUnlink(desPath);
          if (ignoreSrc)
            return;
        }
        throw err;
      });
    }
  });
}

function prepare(userPath, recPath, argv) { 
  if (argv === "revert" || argv === "update")
    return _copyFile(userPath, recPath, {deleteDes: true});
  else if (argv === "clean")
    return Promise.all([promiseUnlink(userPath), promiseUnlink(recPath)]);
  else
    return _copyFile(userPath, recPath, {checkDes: true, ignoreSrc: true});
}

function finish(userPath, recPath, argv) {
  if (argv === "save" || argv === "update")
    return _copyFile(recPath, userPath);
  else
    return Promise.resolve();
}

module.exports = {
  prepare,
  finish
};
