"use strict";

const React = require("react");
const p2r = require("path-to-regexp");
const promiseProtect = require("@gourmet/promise-protect");
const unprefixPath = require("@gourmet/unprefix-path");
const parseHref = require("@gourmet/parse-href");
const BoundRoute = require("./BoundRoute");

let router;

function _prepare(routes, parentOptions) {
  const caseSensitive = routes.caseSensitive === undefined ? parentOptions.caseSensitive : routes.caseSensitive;
  const strictSlash = routes.strictSlash === undefined ? parentOptions.strictSlash : routes.strictSlash;
  return routes.map(item => {
    if (!Array.isArray(item))
      throw Error("Route definition must be an array of shape: [pattern, component, options?]");

    const [pattern, type, opts={}] = item;
    let reverse = opts.reverse;
    let re, keys;

    if (typeof type !== "function" && !Array.isArray(type))
      throw Error("Second element must be a React Component or an array of child routes in route definition");

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
      return {re, keys, name: opts.name, reverse, type};
    }
  });
}

function _join(items) {
  return items.map((item, idx) => {
    const prev = items[idx - 1];
    if (!prev || prev[prev.length - 1] !== "/") {
      if (item[0] !== "/")
        item = "/" + item;
    } else {
      if (item[0] === "/")
        item = item.substr(1);
    }
    return item;
  }).join("");
}

module.exports = class Router {
  constructor(routes, options={}) {
    this.options = options;
    this._routes = _prepare(routes, {
      caseSensitve: options.caseSensitive === undefined ? true : options.caseSensitive,
      strictSlash: options.strictSlash === undefined ? false : options.strictSlash
    });
  }

  setActiveRoute(gmctx, href) {
    return promiseProtect(() => {
      const url = parseHref(href);
      const route = this.findRoute(gmctx, url);

      if (!route) {
        if (gmctx.i80.routeNotFound)
          gmctx.i80.routeNotFound(gmctx, url);
        return false;
      }

      if (route === true)
        return false;   // processed by a route handler

      if (gmctx.i80.didSwitchToHref)
        gmctx.i80.didSwitchToHref(gmctx, url);

      return this.fetchRouteProps(route).then(() => {
        gmctx.i80.activeRoute = route;
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

  renderActiveRoute(gmctx, directProps) {
    if (gmctx.i80) {
      const route = gmctx.i80.activeRoute;

      if (route) {
        const Component = route.getComponent();
        let props;

        if (Component.makeRouteProps)
          props = Component.makeRouteProps(gmctx, directProps);
        else
          props = gmctx.renderer.makeRouteProps(gmctx, directProps);
        return <Component {...props}/>;
      } else {
        return directProps.notFoundContent || (<div>Cannot find a matching route.</div>);
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
      } else {
        for (let idx = 1; idx < m.length; idx++) {
          params[idx] = m[idx];
        }
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

  // `type` can be a string representing the name of the route.
  searchByComponent(gmctx, type, params, search, hash) {
    function _find(routes, reverses) {
      for (let idx = 0; idx < routes.length; idx++) {
        const def = routes[idx];
        let route;

        if (def.routes) {
          route = _find(def.routes, reverses);
          if (route)
            return route;
        } else if ((typeof type === "string" && def.name && def.name === type) ||
            (typeof type === "function" && def.type === type)) {
          route = new BoundRoute(gmctx, def.type, params);
          route.reverse = () => {
            return _join(reverses.concat(def.reverse).map(r => {
              if (!r)
                throw Error("RegExp route pattern requires a reverse function to generate a URL");
              return r(route.params);
            }));
          };
          route.search = search;
          route.hash = hash;
          return route;
        }
      }
    }

    return _find(this._routes, [() => this.options.basePath || "/"]);
  }

  getUrl(component, extras={}, quiet) {
    const route = this.searchByComponent(null, component, extras.params, extras.search, extras.hash);
    if (!route && !quiet)
      throw Error("The component is not registered as a route");
    return route ? route.makeHref() : "/";
  }

  static create(routes, options) {
    if (router)
      throw Error("Router has been initialized already. Called the function 'i80()' from multiple places?");
    router = new this(routes, options);
    return router;
  }

  static get(safeMode) {
    if (!safeMode && !router)
      throw Error("Router is not ready. Forgot to call the function 'i80()'?");
    return router;
  }
};
