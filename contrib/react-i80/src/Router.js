"use strict";

const React = require("react");
const BoundRoute = require("./BoundRoute");

let router;

module.exports = class Router {
  constructor(routes, options, members) {
    this.options = options || {};
    Object.keys(members).forEach(name => {
      this[name] = members[name];
    });
  }

  setActiveRoute(gmctx, url) {
    return Promise().resolve().then(() => {
      const route = this.findRoute(gmctx, url);
      if (!route.command) {
        return this.getInitialProps(gmctx, route).then(props => {
          if (props)
            Object.assign(gmctx.routerData.initialProps, props);
          return gmctx.routerData.activeRoute = route;
        });
      } else {
        return route;
      }
    });
  }

  findRoute(gmctx, url) {
    function _exec(def) {
      const m = def.re.exec(url.path);
      if (m)
        return new BoundRoute(def, m);
    }

    const routes = this._routes;
    for (let idx = 0; idx < routes.length; idx++) {
      let route = _exec(routes[idx]);
      if (route) {
        const handlers = route.getRouteHandlers();
        if (handlers) {
          for (let idx = 0; idx < handlers.length; idx++) {
            const handler = handlers[idx];
            const res = handler(gmctx, route);
            if (res) {
              if (res.command === "skip") {
                route = null;
                break;
              }
              return res;
            }
          }
        }
        return route;
      }
    }

    return {command: "skip"};
  }

  renderActiveRoute(gmctx, renderProps) {
    const route = gmctx.routerData.activeRoute;
    const props = Object.assign({gmctx, route}, gmctx.routerData.initialProps, renderProps);

    if (route) {
      const Component = route.getComponent();
      return <Component {...props}/>;
    } else {
      return props.notFoundContent || (<div>Cannot find a matching route.</div>);
    }
  }

  static create(routes, options, members) {
    if (router)
      throw Error("Router has been initialized already. Called the function 'i80()' from multiple places?");
    router = new Router(routes, options, members);
    return router;
  }

  static get() {
    if (!router)
      throw Error("Router is not ready. Forgot to call the function 'i80()'?");
    return router;
  }
};
