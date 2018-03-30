"use strict";

const vm = require("vm");
const fetch = require("node-fetch");
const XMLHttpRequest = require("./XMLHttpRequest");

// Creates a renderer sandbox to run the script. Call `sandbox.run()` to
// actually run the renderer code (bundle).
// The sandbox is a function wrapped self-contained environment.
// Each call to `sandbox.run()` creates a new scope and runs user's bundle
// inside the scope of the wrapper. This by no means provides perfectly
// isolated sandbox environment, but good enough to protect user's code from
// common memory leak without the huge penalty of creating new vm per each
// rendering request.
module.exports = class RendererSandbox {
  constructor({
    code,       // Code script
    vars={},       // Global variables
    vmOptions   // options for `vm.runInThisContext(...)`
  }) {
    const keys = Object.keys(vars);

    this._varValues = keys.map(key => vars[key]);

    const args = [
      "module",
      "exports",
      "require",
      "window",
      "self",
      "XMLHttpRequest",
      "fetch",
      "Headers",
      "Request",
      "Response"
    ].concat(keys);

    const source = [
      "(function(" + args.join(",") + ") { var __gourmet_module__=module, __gourmet_exports__=exports, __gourmet_require__=require;",
      code,
      "});"
    ].join("\n");

    this._wrapperFunc = vm.runInThisContext(source, Object.assign({
      displayErrors: true,
      lineOffset: 1
    }, vmOptions));
  }

  run() {
    const m = this.createModuleObject();
    this._wrapperFunc.apply(global, [
      m,              // module
      m.exports,      // exports
      m.require,      // require
      global,         // window
      global,         // self
      XMLHttpRequest, // XMLHttpRequest
      fetch,          // fetch
      fetch.Headers,  // Headers
      fetch.Request,  // Request
      fetch.Response  // Response
    ].concat(this._varValues));
    return m.exports;
  }

  createModuleObject() {
    return {
      exports: {},
      require: this.require.bind(this)
    };
  }

  require(id) {
    return require(id);
  }
};
