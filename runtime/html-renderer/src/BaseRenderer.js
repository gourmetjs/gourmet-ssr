"use strict";

const promiseProtect = require("@gourmet/promise-protect");
const getExported = require("@gourmet/get-exported");

module.exports = class BaseRenderer {
  constructor(render, options) {
    this.options = options || {};
    this._userRenderer = getExported(render);
  }

  invokeUserRenderer(gmctx) {
    return promiseProtect(() => {
      return this._userRenderer(gmctx);
    });
  }

  static create(render, options) {
    const Renderer = this;
    return new Renderer(render, options);
  }
};
