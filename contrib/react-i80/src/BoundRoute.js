"use strict";

const {encodeQuery} = require("./utils");

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
    const func = this.getComponent().getInitialProps;
    if (typeof func === "function") {
      return Promise.resolve().then(() => func(this.gmctx, this));
    } else {
      return Promise.resolve(null);
    }
  }

  makeHref() {
    if (this.url)
      return this.url.href;   // This route was made from a href, simply return the original href.

    if (this.reverse) {
      const path = this.reverse();
      return encodeURI(path) + encodeQuery(this.query) + (this.hash || "");
    }

    throw Error("This BoundRoute was unable to generate a URL.");
  }
};
