"use strict";

const p2r = require("path-to-regexp");

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

// We don't use ES6 generator functions to reduce runtime footprint on client.
module.exports = class Matcher {
  constructor(routes) {
    this._routes = _prepare(routes, {caseSensitve: true, strictSlash: false});
  }

  searchByPath(path, callback) {
    function _params(params, m, keys) {
      if (keys.length) {
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
          if (def.routes)
            res = _find(def.routes, _unprefix(path, m), p);
          else
            res = callback(def.type, p);
          if (res)
            return res;
        }
      }
    }

    return _find(this._routes, path, {});
  }
};
