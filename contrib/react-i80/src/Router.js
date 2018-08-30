"use strict";

const React = require("react");
const p2r = require("path-to-regexp");
const {unprefixPath, joinPath, parseHref} = require("./utils");
const BoundRoute = require("./BoundRoute");

let router;

function _prepare(routes, parentOptions) {
  const caseSensitive = routes.caseSensitive === undefined ? parentOptions.caseSensitive : routes.caseSensitive;
  const strictSlash = routes.strictSlash === undefined ? parentOptions.strictSlash : routes.strictSlash;
  return routes.map(item => {
    if (!Array.isArray)
      throw Error("Route definition must be an array of shape: [pattern, reverse?, component]");

    const pattern = item[0];
    let re, reverse, type, keys;

    if (item.length === 3) {
      reverse = item[1];
      type = item[2];
      if (typeof reverse !== "function")
        throw Error("Second element must be a reverse function in route definition");
    } else {
      type = item[1];
    }

    if (typeof type !== "function" && Array.isArray(type))
      throw Error("Last element must be a React Component or an array of child routes in route definition");

    if (typeof pattern === "string") {
      keys = [];
      re = p2r(pattern, keys, {caseSensitive, strictSlash, end: !Array.isArray(type)});
      if (!keys.length)
        keys = undefined;
      if (!reverse)
        reverse = p2r.compile(pattern);
    } else if (pattern instanceof RegExp) {
      re = pattern;
    }

    if (Array.isArray(type)) {
      return {re, keys, reverse, routes: _prepare(type, {caseSensitive, strictSlash})};
    } else {
      return {re, keys, reverse, type};
    }
  });
}

module.exports = class Router {
  constructor(routes, options={}, members) {
    this.options = options;
    Object.keys(members).forEach(name => {
      this[name] = members[name];
    });
    this._routes = _prepare(routes, {
      caseSensitve: options.caseSensitive === undefined ? true : options.caseSensitive,
      strictSlash: options.strictSlash === undefined ? false : options.strictSlash
    });
  }

  setActiveRoute(gmctx, href) {
    return Promise.resolve().then(() => {
      const url = parseHref(href);
      const route = this.findRoute(gmctx, url);

      if (!route) {
        if (gmctx.routerData.routeNotFound)
          gmctx.routerData.routeNotFound(gmctx, url);
        return false;
      }

      if (route === true)
        return false;   // processed by a route handler

      if (gmctx.routerData.didSwitchToHref)
        gmctx.routerData.didSwitchToHref(gmctx, url);

      return this.getInitialProps(route).then(props => {
        if (props)
          Object.assign(gmctx.routerData.initialProps, props);
        gmctx.routerData.activeRoute = route;
        return true;
      });
    });
  }

  findRoute(gmctx, url) {
    return this.searchByPath(gmctx, url, route => {
      const handlers = route.getHandlers();
      if (handlers) {
        for (let idx = 0; idx < handlers.length; idx++) {
          const handler = handlers[idx];
          const res = handler(route);
          if (res)
            return true;  // Handler processed the request, don't render (e.g. `redirect`)
          if (res === false)
            return false; // Skip current route handlers and go to the next route
        }
      }
    });
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

  searchByPath(gmctx, url, callback) {
    function _params(params, m, keys) {
      if (keys && keys.length) {
        params = Object.assign({}, params);
        keys.forEach((info, idx) => {
          const value = m[idx + 1];
          if (value)
            params[info.name] = value;
        });
      }
      return params;
    }

    function _find(routes, path, params) {
      for (let idx = 0; idx < routes.length; idx++) {
        const def = routes[idx];
        const m = def.re.exec(path);
        if (m) {
          const p = _params(params, m, def.keys);
          let res;
          if (def.routes) {
            res = _find(def.routes, unprefixPath(path, m[0]), p);
          } else {
            const route = new BoundRoute(gmctx, def.type, p);
            route.url = url;
            if (callback)
              res = callback(route);
            if (res === undefined)
              res = route;
          }
          if (res)
            return res;
        }
      }
    }

    return _find(this._routes, unprefixPath(url.path, this.options.basePath || "/"), {});
  }

  searchByComponent(gmctx, type, params, query, hash) {
    function _find(routes, reverses) {
      for (let idx = 0; idx < routes.length; idx++) {
        const def = routes[idx];
        let route;

        if (def.routes) {
          route = _find(def.routes, reverses);
          if (route)
            return route;
        } else if (def.type === type) {
          route = new BoundRoute(gmctx, type, params);
          route.reverse = () => {
            return joinPath(reverses.concat(def.reverse).map(r => {
              if (!r)
                throw Error("RegExp route pattern requires a reverse function to generate a URL");
              return r(route.params);
            }));
          };
          route.query = query;
          route.hash = hash;
          return route;
        }
      }
    }

    return _find(this._routes, [() => this.options.basePath || "/"]);
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