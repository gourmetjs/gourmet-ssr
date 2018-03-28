"use strict";

const util = require("util");
const fs = require("fs");
const crypto = require("crypto");
const baseX = require("base-x");
const error = require("@gourmet/error");
const promiseReadFile = require("@gourmet/promise-read-file");
const promiseWriteFile = require("@gourmet/promise-write-file");

const promiseUnlink = util.promisify(fs.unlink);

// This table is extracted from `https://github.com/webpack/loader-utils`
const baseChars = {
  "base26": "abcdefghijklmnopqrstuvwxyz",
  "base32": "123456789abcdefghjkmnpqrstuvwxyz", // no 0lio
  "base36": "0123456789abcdefghijklmnopqrstuvwxyz",
  "base49": "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", // no lIO
  "base52": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "base58": "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", // no 0lIO
  "base62": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "base64": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
};

const INVALID_HASH_KEY = {
  message: "Hash key '${key}' conflicts with existing keys in case-insensitive setup",
  code: "INVALID_HASH_KEY"
};

class HashNames {
  constructor({
    encoding="base62",
    hashType="sha1",
    minLength=4,
    avoidCaseConflict=true
  }={}) {
    if (baseChars[encoding]) {
      this.encoder = baseX(baseChars[encoding]).encode;
      if (parseInt(encoding.substr(4), 10) >= 49)
        this.converter = function(name) {return name.toLowerCase();};
      else
        this.converter = function(name) {return name;};
    } else {
      this.encoder = function(buf) {return buf.toString(encoding);};
      this.converter = function(name) {return name;};
    }
    this.hashType = hashType;
    this.minLength = minLength;
    this.avoidCaseConflict = avoidCaseConflict;
    this._names = {};
  }

  getHashName(content, {addNew=true}={}) {
    const _find = name => {
      const keys = Object.keys(names);
      const namei = this.converter(name);
      for (let idx = 0; idx < keys.length; idx++) {
        const key = keys[idx];
        if (names[key].namei === namei)
          return true;
      }
      return false;
    };

    const key = this.getFullHash(content);
    const names = this._names;

    if (names[key])
      return {key, name: names[key].name};

    if (!addNew)
      return undefined;

    let name;
    let idx;

    for (idx = this.minLength; idx <= key.length; idx++) {
      name = key.substr(0, idx);
      if (!_find(name))
        break;
    }

    if (idx > key.length) {
      for (let idx = 0; idx < 65536; idx++) {
        name = key + idx.toString(16);
        if (!_find(name))
          break;
      }
      if (idx >= 65536)
        throw error(INVALID_HASH_KEY, key);
    }

    names[key] = {
      name,
      namei: this.converter(name)
    };

    return {key, name};
  }

  getFullHash(content) {
    const hash = crypto.createHash(this.hashType);
    hash.update(content);
    return this.encoder(hash.digest());
  }

  serialize() {
    const names = this._names;
    return Object.keys(names).reduce((obj, key) => {
      obj[key] = names[key].name;
      return obj;
    }, {});
  }

  deserialize(obj) {
    this._names = Object.keys(obj).reduce((names, key) => {
      const name = obj[key];
      names[key] = {
        name,
        namei: this.converter(name)
      };
      return names;
    }, {});
  }

  load(path) {
    return promiseReadFile(path, "utf8").then(content => {
      const obj = JSON.parse(content);
      this.deserialize(obj);
    }).catch(err => {
      if (err.code === "???")
        this.deserialize({});
      else
        throw err;
    });
  }

  save(path) {
    const obj = this.serialize();
    const content = JSON.stringify(obj, null, 2);
    return promiseWriteFile(path, content, "utf8");
  }

  reset(path) {
    this.deserialize({});
    return promiseUnlink(path);
  }
}

module.exports = HashNames;
