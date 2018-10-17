"use strict";

const basex = require("base-x");

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

module.exports = function getBaseX(encoding) {
  return basex(baseChars[encoding]);
};
