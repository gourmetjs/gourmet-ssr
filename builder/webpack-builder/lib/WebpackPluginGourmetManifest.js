"use strict";

const util = require("util");
const promiseProtect = require("@gourmet/promise-protect");

// Webpack plugin that emits a manifest file for Gourmet Framework.
module.exports = class WebpackPluginGourmetManifest {
  constructor({context, onComplete}) {
    this.context = context;
    this.onComplete = onComplete;
  }

  apply(compiler) {
    let isFirst = true;

    compiler.hooks.emit.tap("WebpackPluginGourmetManifest", compilation => {
      if (!isFirst)
        return;

      isFirst = false;

      const context = this.context;
      const obj = {};

      ["target", "stage", "debug", "minify", "sourceMap", "hashNames", "staticPrefix"].forEach(name => {
        obj[name] = context[name];
      });

      Object.assign(obj, {
        compilation: compilation.hash,
        dependencies: this._getDependencies(compilation),
        files: this._getFiles(compilation)
      });

      return promiseProtect(() => {
        if (typeof this.onComplete === "function")
          return this.onComplete(obj);
      });
    });
  }

  _getDependencies(compilation) {
    const eps = compilation.entrypoints;
    const deps = {};
    if (eps) {
      eps.forEach((ep, name) => {
        deps[name] = ep.getFiles();
      });
    }
    return deps;
  }

  _getFiles(compilation) {
    return Object.keys(compilation.assets);
  }

  [util.inspect.custom]() {
    return "WebpackPluginGourmetManifest {}";
  }
};
