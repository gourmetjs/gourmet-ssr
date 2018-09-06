"use strict";

const promiseProtect = require("@gourmet/promise-protect");

// `BoundRoute` can be created as one of two types:
// - A path based `BoundRoute` is created by `searchByPath()` and has
//   the following members.
//   - gmctx, _type
//   - params: extracted from the matching path
//   - url: result of `parseHref()` as following shape:
//     - {origin, path, search, hash, href}
// - A component based `BoundRoute` is created by `searchByComponent` and has
//   the following members.
//   - gmctx, _type
//   - params: input parameters given to `searchByComponent`
//   - search: input parameters given to `searchByComponent`
//   - hash: input parameters given to `searchByComponent`
//   - reverse(): reverse URL function that returns a path string
module.exports = class BoundRoute {
  constructor(gmctx, type, params) {
    this.gmctx = gmctx;
    this._type = type;
    this.params = params;
  }

  getComponent() {
    return this._type;
  }

  getDisplayName() {
    const type = this.getComponent();
    return type.routeDisplayName || type.displayName || type.name || "Unnamed Route";
  }

  getHandlers() {
    return this.getComponent().routeHandlers;
  }

  getInitialProps() {
    return promiseProtect(() => {
      const func = this.getComponent().getInitialProps;
      if (typeof func === "function") {
        return func(this.gmctx, this);
      } else {
        return Promise.resolve(null);
      }
    });
  }

  makeHref() {
    if (this.url)
      return this.url.href;   // This route was made from a href, simply return the original href.

    if (this.reverse) {
      const path = this.reverse();
      return encodeURI(path) + (this.search || "") + (this.hash || "");
    }

    throw Error("This BoundRoute was unable to generate a URL.");
  }
};
