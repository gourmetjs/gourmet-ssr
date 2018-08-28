"use strict";

module.exports = class BoundRoute {
  constructor(type, params) {
    this.type = type;
    this.params = params;
  }

  getComponent() {
    return this.type;
  }

  getParams() {
    return this.params;
  }

  getDisplayName() {
    const type = this.type;
    return type.routeDisplayName || type.displayName || type.name || "Unnamed Route";
  }

  getHandlers() {
    return this.type.routeHandlers;
  }

  getInitialProps(gmctx, route) {
    const func = this.type.getInitialProps;
    if (typeof func === "function") {
      return Promise.resolve().then(() => func(gmctx, route));
    } else {
      return Promise.resolve(null);
    }
  }
};
