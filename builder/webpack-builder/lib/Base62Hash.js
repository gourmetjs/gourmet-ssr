"use strict";

const crypto = require("crypto");
const b62 = require("@gourmet/base-x")("base62");

// This is a hacky way to support "base62" encoding in Webpack.
module.exports = class Base62Hash {
  constructor() {
    this.hash = crypto.createHash("sha1");
  }

  update(data) {
    this.hash.update(data);
    return this;
  }

  digest(format) {
    // We don't use `base62` because Webpack may complain about it in
    // the future during the schema check.
    if (format === "base64")
      return b62.encode(this.hash.digest());
    else
      return this.hash.digest(format);
  }
};
