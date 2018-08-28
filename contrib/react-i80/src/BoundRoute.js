"use strict";

module.exports = class BoundRoute {
  constructor(def, m) {
    this.params = _params(m);
    this.type = def.type;
  }

  getComponent() {
    return this.type;
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
