"use strict";

const promiseProtect = require("@gourmet/promise-protect");
const getExported = require("@gourmet/get-exported");

module.exports = class BaseRenderer {
  constructor(userObject, options) {
    this.options = options || {};
    this.userObject = getExported(userObject);
  }

  // Default implementation assumes that the `userObject` is a function.
  invokeUserRenderer(gmctx) {
    return promiseProtect(() => {
      return this.userObject(gmctx);
    });
  }

  static create(render, options) {
    const Renderer = this;
    return new Renderer(render, options);
  }
};
