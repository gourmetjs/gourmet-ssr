"use strict";

const React = require("react");

let router;

module.exports = class Router {
  constructor(routes, options, members) {
    this.options = options || {};
    Object.keys(members).forEach(name => {
      this[name] = members[name];
    });
  }

  // `component` is given only when the route changes after the initial
  // rendering on the client.
  setActiveRoute(gmctx, url, component) {
    return Promise().resolve().then(() => {
      const routes = this._routes;
      for (let idx = 0; idx < routes.length; idx++) {
        let route = _exec(routes[idx]);
        if (route) {
          const handlers = this.getRouteHandlers(route.Component);
          if (handlers) {
            for (let idx = 0; idx < handlers.length; idx++) {
              const handler = handlers[idx];
              const res = handler(gmctx, route);
              if (res === false) {
                route = null;
                break;
              }
              if (res && res.redirect)
                return res;
            }
          }
          return route;
        }
      }
      return null;
    }).then(route => {
      if (route && route.redirect) {
        if (route.Component.getInitialProps)
          return route.getInitalProps(gmctx, route);
        }).then(props => {
          if (props)
            Object.assign(gmctx.routerData.initialProps, props);
    });
  }

  renderActiveRoute(gmctx, renderProps) {
    const route = gmctx.routerData.activeRoute;
    const props = Object.assign({
      gmctx,
      route
    }, gmctx.routerData.initialProps, renderProps);

    if (route) {
      return <route.Component {...props}/>;
    } else {
      return props.notFoundContent || (<div>Cannot find a matching route!</div>);
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


/*
// - Route handler features
//   - Can return a promise for async job
//   - Can skip the current route and go to the next route
//   - Can redirect to URL (302 on server, `go` on browser)

const Router = require("./Router");

module.exports = function(gmctx) {
  const router = Router.get();
  const info = router.getCurrentUrl(gmctx);
  return router.findRoute(gmctx, info).then(route => {
    if (!route)
      return null;
    if (typeof route.component.getInitialProps === "function") {
      return 
    }
  });




  return router.runRouteHandlers(gmctx, route).then(res => {
    if (res === null)
      return null;

    if (res.redirect)
      router.redirect(res.redirect);


  });

  gmctx.route = route;
  gmctx._routerTest = "server";
  });
};
*/