"use strict";

const React = require("react");
const Matcher = require("./Matcher");
const BoundRoute = require("./BoundRoute");

let router;

module.exports = class Router {
  constructor(routes, options, members) {
    this.options = options || {};
    Object.keys(members).forEach(name => {
      this[name] = members[name];
    });
    this.matcher = new Matcher(routes, this.options);
  }

  setActiveRoute(gmctx, url) {
    return Promise.resolve().then(() => {
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
    const route = this.matcher.searchByPath(url.path, (type, params) => {
      const route = new BoundRoute(type, params);
      const handlers = route.getHandlers();
      if (handlers) {
        for (let idx = 0; idx < handlers.length; idx++) {
          const handler = handlers[idx];
          const res = handler(gmctx, route);
          if (res) {
            if (res.command === "skip")
              return null;
            return res;
          }
        }
      }
      return route;
    });
    return route || {command: "skip"};
  }

  renderActiveRoute(gmctx, renderProps) {
    if (gmctx.routerData) {
      const route = gmctx.routerData.activeRoute;
      const props = Object.assign({gmctx, route}, gmctx.routerData.initialProps, renderProps);

      if (route) {
        const Component = route.getComponent();
        return <Component {...props}/>;
      } else {
        return props.notFoundContent || (<div>Cannot find a matching route.</div>);
      }
    } else {
      throw Error("Router is not initialized properly. Forgot to add '@gourmet/plugin-react-80'?");
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
