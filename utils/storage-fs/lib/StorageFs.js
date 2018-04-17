"use strict";

const npath = require("path");
const base_fs = require("fs");
const base_mkdirp = require("mkdirp");
const isStream = require("@gourmet/is-stream");
const promiseQueue = require("@gourmet/promise-queue");

class StorageFs {
  constructor({basePath="", fs=base_fs, mkdirp=base_mkdirp}={}) {
    this.basePath = npath.resolve(process.cwd(), basePath);
    this.fs = fs;
    this.mkdirp = mkdirp;
  }

  createReadStream(path, {start, end}={}) {
    return new Promise((resolve, reject) => {
      const stream = this.fs.createReadStream(this._getPath(path), {start, end});
      stream.once("open", () => {
        stream.removeListener("error", reject);
        resolve(stream);
      });
      stream.once("error", reject);
    });
  }

  readFile(path) {
    return new Promise((resolve, reject) => {
      this.fs.readFile(this._getPath(path), (err, data) => {
        if (err)
          reject(err);
        else
          resolve(data);
      });
    });
  }

  writeFile(path, data) {
    return this._createWriteStream(this._getPath(path)).then(stream => {
      if (isStream(data))
        data.pipe(stream);
      else
        stream.end(data);
      return new Promise((resolve, reject) => {
        stream.once("close", resolve).once("error", reject);
      });
    });
  }

  exists(path) {
    return this.stat(path).then(() => true, err => {
      if (err.code === "ENOENT")
        return false;
      throw err;
    });
  }

  stat(path) {
    return new Promise((resolve, reject) => {
      this.fs.stat(this._getPath(path), (err, stats) => {
        if (err)
          return reject(err);
        if (stats.isFile()) {
          resolve({mtime: stats.mtime, size: stats.size});
        } else {
          reject(Error("Invalid file type: " + path));
        }
      });
    });
  }

  unlink(path) {
    return new Promise((resolve, reject) => {
      this.fs.unlink(this._getPath(path), err => {
        if (err && err.code !== "ENOENT")
          reject(err);
        else
          resolve();
      });
    });
  }

  // Gets an array of the file object as follows:
  // [{name: "file_name", mtime: <Date>, size: <Number>}, ...]
  // Only files are returned (no directories).
  listFiles(path) {
    return new Promise((resolve, reject) => {
      path = this._getPath(path);
      this.fs.readdir(path, (err, files) => {
        if (err)
          return reject(err);
        const items = [];
        promiseQueue({data: files}).run(item => {
          return new Promise((resolve, reject) => {
            this.fs.stat(npath.join(path, item), (err, stats) => {
              if (err)
                return reject(err);
              if (stats.isFile())
                items.push({name: item, mtime: stats.mtime, size: stats.size});
              resolve();
            });
          });
        }).then(() => {
          items.sort((a, b) => {
            if (a < b)
              return -1;
            if (a > b)
              return 1;
            return 0;
          });
          resolve(items);
        }).catch(reject);
      });
    });
  }

  rename(oldPath, newPath) {
    oldPath = this._getPath(oldPath);
    newPath = this._getPath(newPath);
    return new Promise((resolve, reject) => {
      this.fs.rename(oldPath, newPath, err => {
        if (err && err.code === "ENOENT") {
          this.mkdirp(npath.dirname(newPath), err => {
            if (err)
              return reject(err);
            this.fs.rename(oldPath, newPath, err => {
              if (err)
                reject(err);
              else
                resolve();
            });
          });
        } else {
          if (err)
            reject(err);
          else
            resolve();
        }
      });
    });
  }

  _getPath(path) {
    return npath.resolve(this.basePath, path);
  }

  _createWriteStream(path) {
    return new Promise((resolve, reject) => {
      const stream = this.fs.createWriteStream(path);
      stream.once("open", () => resolve(stream));
      stream.once("error", err => {
        if (err.code === "ENOENT") {
          this.mkdirp(npath.dirname(path), err => {
            if (err)
              return reject(err);
            const stream = this.fs.createWriteStream(path);
            stream.once("open", () => resolve(stream));
            stream.once("error", reject);
          });
        } else {
          reject(err);
        }
      });
    });
  }
}

module.exports = StorageFs;
