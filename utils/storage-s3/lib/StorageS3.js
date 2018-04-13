"use strict";

const posix = require("path").posix;
const promiseRepeat = require("@gourmet/promise-repeat");
const getAwsService = require("@gourmet/get-aws-service");

// Implementation of this class was partly inspired by https://github.com/RiptideElements/s3fs.
// Why didn't we simply use it instead? A single session of `S3WriteStream` can consume 5GB of memory.
// It didn't look like a library written for a multi-tenant environment.
// Also, this class doesn't need to be a drop-in replacement of `fs`, so the compatiblity layer of
// `s3fs` is the unnecessary overhead to us.

class StorageS3 {
  constructor(options={}) {
    const {basePath="", bucket} = options;
    this.s3 = getAwsService("s3", "S3", options);
    this.bucket = bucket;
    this.basePath = basePath[0] === "/" ? basePath.substr(1) : basePath;
  }

  createReadStream(path, {start, end}={}) {
    return new Promise((resolve, reject) => {
      const _handleError = err => {
        reject(this._normalizeError(err, path));
      };
      const req = this.s3.getObject({
        Bucket: this.bucket,
        Key: this._getKey(path),
        Range: start !== undefined && end !== undefined ? "bytes=" + start + "-" + end : undefined
      });
      req.on("httpHeaders", status => {
        if (status >= 200 && status < 300) {
          stream.removeListener("error", _handleError);
          resolve(stream);
        }
      });
      const stream = req.createReadStream();
      stream.once("error", _handleError);
      return stream;
    });
  }

  readFile(path) {
    return this.s3.getObject({
      Bucket: this.bucket,
      Key: this._getKey(path)
    }).promise().then(data => {
      return data.Body;
    }).catch(err => {
      throw this._normalizeError(err, path);
    });
  }

  // Intermediate directories don't matter because S3 doesn't have directories.
  // Data can be a Buffer, string or readable stream.
  // Returns a promise resolved when done.
  writeFile(path, data) {
    return this.s3.upload({
      Bucket: this.bucket,
      Key: this._getKey(path),
      Body: data
    }, {
      partSize: 5*1024*1024,
      queueSize: 1
    }).promise();
  }

  // Works on files only.
  exists(path) {
    return this.s3.headObject({
      Bucket: this.bucket,
      Key: this._getKey(path)
    }).promise().then(() => true, err => {
      if (err.code === "NoSuchKey" || err.code === "NotFound")
        return false;
      throw err;
    });
  }

  // Works on files only.
  stat(path) {
    return this.s3.headObject({
      Bucket: this.bucket,
      Key: this._getKey(path)
    }).promise().then(data => {
      return {
        size: parseInt(data.ContentLength, 10),
        mtime: data.LastModified
      };
    }).catch(err => {
      throw this._normalizeError(err, path);
    });
  }

  unlink(path) {
    return this.s3.deleteObject({
      Bucket: this.bucket,
      Key: this._getKey(path)
    }).promise();
  }

  // Gets an array of the file object as follows:
  // [{name: "file_name", mtime: <Date>, size: <Number>}, ...]
  // Only files are returned (no directories).
  // `chunkSize` is a S3 specific option and for debugging / testing only.
  listFiles(path, {chunkSize=1000}={}) {
    let prefix = posix.join(this._getKey(path), "/");
    const files = [];
    let startAfter;

    if (prefix === "/")
      prefix = "";

    return promiseRepeat(() => {
      return this.s3.listObjectsV2({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: chunkSize,
        StartAfter: startAfter
      }).promise().then(data => {
        const items = data.Contents;
        items.forEach(item => {
          const name = item.Key.substr(prefix.length);
          if (name.lastIndexOf("/") === -1) {   // only leaf items
            files.push({
              name,
              mtime: item.LastModified,
              size: item.Size
            });
          }
        });
        if (data.IsTruncated)
          startAfter = items[items.length - 1].Key;
        else
          return files;
      });
    });
  }

  rename(oldPath, newPath) {
    oldPath = this._getKey(oldPath);
    newPath = this._getKey(newPath);
    return this.s3.copyObject({
      Bucket: this.bucket,
      Key: newPath,
      CopySource: this.bucket + "/" + oldPath
    }).promise().then(() => {
      return this.s3.deleteObject({
        Bucket: this.bucket,
        Key: oldPath
      }).promise().then(() => {});
    });
  }

  _getKey(path) {
    path = posix.join(this.basePath, path);
    return path[0] === "/" ? path.substr(1) : path;
  }

  static create(options) {
    return new StorageS3(options);
  }

  _normalizeError(err, path) {
    if (err.code === "NoSuchKey" || err.code === "NotFound") {
      err = new Error("Path not found: " + path);
      err.code = "ENOENT";
      err.path = path;
    }
    return err;
  }
}

module.exports = StorageS3;
