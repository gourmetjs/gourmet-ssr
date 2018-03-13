"use strict";

const qs = require("querystring");
const repeat = require("promise-box/lib/repeat");
const isPlainObject = require("@gourmet/is-plain-object");
const deepProp = require("@gourmet/deep-prop");
const deepScan = require("@gourmet/deep-scan");
const error = require("@gourmet/error");

const NON_STRING_MIX = {
  message: "Trying to populate non-string value into a string for variable '${var}'",
  code: "NON_STRING_MIX"
};

const VAR_SYNTAX_ERROR = {
  message: "Variable syntax error: ${expr}",
  code: "VAR_SYNTAX_ERROR"
};

const VAR_SOURCE_EXISTS = {
  message: "Variable source already exists: ${source}",
  code: "VAR_SOURCE_EXISTS"
};

const INVALID_VAR_SOURCE = {
  message: "Invalid source name '${source} in variable: ${expr}",
  code: "INVALID_VAR_SOURCE"
};

const CIRCULAR_VAR_REF = {
  message: "Circular variable reference detected: ${path}",
  code: "CIRCULAR_VAR_REF"
};

const REF_SYNTAX = /^(?:(?:(\w+):)?([\w-.~/%]+)(?:\?(.*))?)$/;
const VALUE_SYNTAX = /^(?:"([^"]*)"|'([^']*)'|([\d.]+)|(null|true|false))$/;

// Simple wrapper class to indicate a text value yet to be resolved.
class VarNode {
  constructor(text) {
    this._orgText = text;
  }
}

class Variables {
  constructor({
    object,
    sources=[],
    syntax=/(\$?)\${([\w-.~/%?=& '",]+?)}/,
    defaultSource="self"
  }) {
    this.syntax = syntax;
    this.defaultSource = defaultSource;

    this._object = object;
    this._sources = {};

    this.addSource(...sources);
  }

  // Returns a promise that will resolve to a concrete value with all variables
  // resolved. The result can be any JavaScript value, such as string, number,
  // object, array, ..etc.
  //
  // - [root] `{ bootstrap: {theme: "${sys:stage}-blue"} }`
  // - [code] `vars.get("bootstrap").then(boostrap => { console.log(JSON.stringify(bootstrap)) })`
  //    => `{theme: "dev-blue"}`
  // - [code] `vars.get("bootstrap.theme").then(theme => { console.log(JSON.stringify(theme)) })`
  //    => `"dev-blue"`
  //
  // options:
  //  - strict: strict mode for property read
  //  - force: do not use a cached value
  //  - strictCircular: throws exception instead of `"!CIRCULAR_REF!"` for circular references
  get(path, options={}) {
    return deepProp(this._object, path, (value, prop, parent) => {
      if (value instanceof VarNode)
        return this._resolveNode(value, prop, parent, path, options);
      else
        return Promise.resolve(value);
    }, options).then(value => {
      return this._resolveAll(value, path, options);
    });
  }

  eval(value) {

  }

  // Adds a variable sources (instance of `VariableSource` class)
  addSource(...sources) {
    Object.keys(sources).forEach(src => {
      if (this._sources[src.name])
        throw error(VAR_SOURCE_EXISTS, {source: src.name});
      this._sources[src.name] = src;
    });
  }

  // `node` must be an instance of `VarNode`.
  _resolveNode(node, prop, parent, path, {strict, force, strictCircular}) {
    if (node._isLocked) {
      if (strictCircular)
        throw error(CIRCULAR_VAR_REF, {path});
      else
        return Promise.resolve("!CIRCULAR_REF!");
    }

    if (!force && node.hasOwnProperty("_cachedValue"))
      return Promise.resolve(node._cachedValue);

    node._isLocked = true;

    const literals = [];
    let value = node._orgText;
    let hadVarExpr;

    return repeat(() => {
      const m = value.match(this.syntax);

      if (!m)
        return value;

      const pos = m.index;
      const len = m[0].length;

      if (!m[1]) {
        hadVarExpr = true;
        return this._resolveExpr(m[2], {expr: m[0], strict}).then(resolvedValue => {
          if (typeof resolvedValue !== "string") {
            if (pos === 0 && len === value.length && !literals.length) {
              value = resolvedValue;
              return value;
            } else {
              throw error(NON_STRING_MIX, {var: m[0]});
            }
          } else {
            value = [
              value.substr(0, pos),
              resolvedValue,
              value.substr(pos + len)
            ].join("");
          }
        });
      } else {
        if (pos)
          literals.push(value.substr(0, pos));
        literals.push(value.substr(pos + m[1].length, m[2].length));
        if (pos + len >= value.length)
          return value;
        value = value.substr(pos + len);
      }
    }).then(() => {
      if (typeof value === "string") {
        if (literals.length)
          value = literals.join("") + value;
        if (!hadVarExpr)  // if the string is var-free, replace the node
          parent[prop] = value;
      }

      node._isLocked = false;
      node._cachedValue = value;

      return value;
    });
  }

  // Resolves an expression (i.e. `expr` in `${expr}') of a variable
  // reference to a concrete value.
  _resolveExpr(expr, options) {
    const items = expr.split(",");
    const ref = this._parseRefExpr(items[0] || "", options);
    return this._resolveRef(ref, options).then(value => {
      if (value === undefined) {
        const def = this._parseDefaultExpr(items[1] || "", options);
        if (!def)
          return undefined;
        else if (def.type === "value")
          return def.value;
        else
          return this._resolveRef(def, options);
      } else {
        return value;
      }
    });
  }

  // Parses a reference expression (i.e. `ref` in `${ref, def}`) of a variable
  // reference and returns an object with the parsed information.
  _parseRefExpr(ref, {expr}) {
    ref = ref.trim();

    const m = ref.match(REF_SYNTAX);

    if (!m)
      throw error(VAR_SYNTAX_ERROR, {expr});

    return {
      type: "ref",
      source: m[1] || this.defaultSource,
      path: decodeURI(m[2]),
      query: m[3] ? qs.parse(m[3]) : {}
    };
  }

  // Parses a default expression (i.e. `def` in `${ref, def}`) of a variable
  // reference and returns an object with the parsed information.
  _parseDefaultExpr(def, {expr}) {
    def = def.trim();

    if (!def)
      return null;

    const m = def.match(VALUE_SYNTAX);

    if (m) {
      let value;

      if (m[1] !== undefined)
        value = m[1];
      else if (m[2] !== undefined)
        value = m[2];
      else if (m[3])
        value = parseInt(m[3], 10);
      else if (m[4] === "null")
        value = null;
      else if (m[4] === "true")
        value = true;
      else
        value = false;

      return {
        type: "value",
        value
      };
    }

    return this._parseRefExpr(def, {expr});
  }

  _resolveRef(info, options) {
    const src = this._sources[info.source];

    if (!src)
      throw error(INVALID_VAR_SOURCE, {source: info.source, expr: options.expr});

    return src.resolve(info, options);
  }

  _resolveAll(value, path, options) {
    let des;
    return deepScan(value, path, (value, prop, parent, path) => {
      if (value instanceof VarNode) {
        return this._resolveNode(value, prop, parent, path, options);
      } else {
        if (isPlainObject(value))
          value = {};
        else if (Array.isArray(value))
          value = [];

        if (!des)
          des = value;
        else
          des[prop] = value;
      }
    }).then(() => {
      return des;
    });
  }
}

module.exports = Variables;
