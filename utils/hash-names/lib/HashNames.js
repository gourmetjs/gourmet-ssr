"use strict";

const util = require("util");
const crypto = require("crypto");
const basex = require("base-x");
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

const COLLISION_ERROR = {
  message: "Truncated hash '${name}' from '${data}' collided with existing one.\n${suggestionMesage}",
  code: "COLLISION_ERROR"
};

class HashNames {
  constructor(options) {
    this.options = options = Object.assign({
      hashType: "sha1",
      encoding: "base62",
      digestLength: 27,
      errorOnCollision: false,
      suggestionMesage: null,
      avoidCaseCollision: false
    }, options);

    if (baseChars[options.encoding]) {
      this.encode = basex(baseChars[options.encoding]).encode;
      if (options.avoidCaseCollision && parseInt(options.encoding.substr(4), 10) >= 49)
        this.lower = name => name.toLowerCase();
      else
        this.lower = name => name;
    } else {
      this.encode = buf => buf.toString(options.encoding);
      this.lower = name => name;
    }

    // shortened names indexed by full hash
    this._names = {};
  }

  // Generates a base62 hash digest from the data, truncates it to `digestLength`
  // and checks the history to see if it collides with any existing one.
  // If it does, throws an error if `errorOnCollision` is true.
  // If `errorOnCollision` is false, this function silently increases the length
  // of truncation until it doesn't collide. If `avoidCaseCollision` is true,
  // it means the output file system is case insensitive and collision check
  // should take this into account. In theory, the final name can be longer
  // than the original full hash.
  getEntry(data) {
    const _find = name => {
      const keys = Object.keys(names);
      const namei = this.lower(name);
      for (let idx = 0; idx < keys.length; idx++) {
        const key = keys[idx];
        if (names[key].namei === namei)
          return true;
      }
      return false;
    };

    const options = this.options;
    const hash = this.getHash(data);
    const names = this._names;
    let name, idx;

    if (names[hash])
      return {hash, name: names[hash].name};

    for (idx = options.digestLength; idx <= hash.length; idx++) {
      name = hash.substr(0, idx);
      if (_find(name)) {
        if (options.errorOnCollision) {
          if (typeof data === "string" && data.length > 200)
            data = data.substring(0, 200) + "...";
          data = util.inspect(data);
          throw error(COLLISION_ERROR, {name, data, suggestionMesage: options.suggestionMesage || ""});
        }
      } else {
        break;
      }
    }

    if (idx > hash.length) {
      if (options.avoidCaseCollision) {
        for (idx = 0; idx < 65536; idx++) {
          name = hash + idx.toString(16);
          if (!_find(name))
            break;
        }
      } else {
        idx = 65536;
      }
      if (idx >= 65536)
        throw Error("Critical error - a full hash collision detected: " + hash);
    }

    names[hash] = {name, namei: this.lower(name)};

    return {hash, name: names[hash].name};
  }

  get(data) {
    return this.getEntry(data).name;
  }

  getHash(data) {
    const hash = crypto.createHash(this.options.hashType);
    hash.update(data);
    return this.encode(hash.digest());
  }
}

module.exports = HashNames;
