"use strict";

const crypto = require("crypto");
const baseX = require("base-x");
const error = require("@gourmet/error");

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
  message: "Hash key '${hash}' conflicts with existing keys in case-insensitive setup",
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

  getEntry(content, {addNew=true}={}) {
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

    const hash = this.getHash(content);
    const names = this._names;

    if (names[hash])
      return {hash, name: names[hash].name};

    if (!addNew)
      return undefined;

    let name;
    let idx;

    for (idx = this.minLength; idx <= hash.length; idx++) {
      name = hash.substr(0, idx);
      if (!_find(name))
        break;
    }

    if (idx > hash.length) {
      for (let idx = 0; idx < 65536; idx++) {
        name = hash + idx.toString(16);
        if (!_find(name))
          break;
      }
      if (idx >= 65536)
        throw error(INVALID_HASH_KEY, {hash});
    }

    names[hash] = {
      name,
      namei: this.converter(name)
    };

    return {hash, name};
  }

  // Gets a short ID for the content
  getName(content, options) {
    return this.getEntry(content, options).name;
  }

  // Gets a full hash of the content
  getHash(content) {
    const hash = crypto.createHash(this.hashType);
    hash.update(content);
    return this.encoder(hash.digest());
  }

  serialize() {
    const names = this._names;
    return Object.keys(names).reduce((obj, hash) => {
      obj[hash] = names[hash].name;
      return obj;
    }, {});
  }

  deserialize(obj) {
    this._names = Object.keys(obj).reduce((names, hash) => {
      const name = obj[hash];
      names[hash] = {
        name,
        namei: this.converter(name)
      };
      return names;
    }, {});
  }
}

module.exports = HashNames;
