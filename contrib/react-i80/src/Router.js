"use strict";

let router;

module.exports = class Router {
  constructor(routes, options, members) {
    this.options = options || {};
    Object.keys(members).forEach(name => {
      this[name] = members[name];
    });
  }

  forceUpdate() {
    if (this.forceUpdateComponent)
      this.forceUpdateComponent();
  }

  renderCurrentRoute(gmctx, props, update) {
    const info = this.getCurrentUrl(gmctx);
    const route = this.findRoute(info);

    if (route)
    if (update)
      this.forceUpdateComponent = update;
  }

  clearCurrentRoute(gmctx, component) {

  }

  static create(routes, options, members) {
    if (router)
      throw Error("Router has been initialized already. Called the function 'i80()' from multiple places?");
    router = new Router(routes, options, members);
    return router;
  }

  static get() {
    if (!router)
      throw Error("Router has never been initialized. Forgot to call the function 'i80()'?");
    return router;
  }
};
