"use strict";

const qs = require("querystring");
const isPromise = require("promise-box/lib/isPromise");
const forEach = require("promise-box/lib/forEach");
const repeat = require("promise-box/lib/repeat");
const isPlainObject = require("@gourmet/is-plain-object");
const error = require("@gourmet/error");
const VarNode = require("./VarNode");

const VAR_SYNTAX_ERROR = {
  message: "Variable syntax error: ${expr}",
  code: "VAR_SYNTAX_ERROR"
};

const NON_STRING_MIX = {
  message: "Trying to populate non-string value into a string for variable: \"${text}\"",
  code: "NON_STRING_MIX"
};

const CIRCULAR_VAR_REF = {
  message: "Circular variable reference detected while accessing property '${path}'",
  code: "CIRCULAR_VAR_REF"
};

const REF_SYNTAX = /^(?:(?:(\w+):)?([\w-.~/%]+)(?:\?(.*))?)$/;
const VALUE_SYNTAX = /^(?:"([^"]*)"|'([^']*)'|([\d.]+)|(null|true|false))$/;

class VarExpr extends VarNode {
  constructor(text) {
    super();
    this._orgText = text;
  }

  resolve(vars, prop, parent, path, options) {
    if (this._isLocked)
      throw error(CIRCULAR_VAR_REF, {path});

    if (!options.force && this.hasOwnProperty("_cachedValue"))
      return Promise.resolve(this._cachedValue);

    this._isLocked = true;

    const literals = [];
    let value = this._orgText;
    let hadVarExpr;

    return repeat(() => {
      const m = value.match(vars._syntax);

      if (!m)
        return value;

      const pos = m.index;
      const len = m[0].length;

      if (!m[1]) {
        hadVarExpr = true;
        return this._resolveExpr(vars, m[2], Object.assign({expr: m[0]}, options)).then(resolvedValue => {
          if (pos === 0 && len === value.length && !literals.length) {
            value = resolvedValue;
            return value;
          } else if (isPlainObject(resolvedValue) || Array.isArray(resolvedValue)) {
            throw error(NON_STRING_MIX, {text: this._orgText});
          } else {
            value = [
              value.substr(0, pos),
              resolvedValue,
              value.substr(pos + len)
            ].join("");
          }
        });
      } else {
        literals.push(value.substr(0, pos + len));
        value = value.substr(pos + len);
      }
    }).then(() => {
      if (typeof value === "string") {
        if (literals.length)
          value = literals.join("") + value;
        if (parent && !hadVarExpr)  // if the string is var-free, replace the node
          parent[prop] = value;
      }

      this._isLocked = false;
      this._cachedValue = value;

      return value;
    });
  }

  // Resolves an expression (i.e. `expr` in `${expr}') of a variable
  // reference to a concrete value.
  _resolveExpr(vars, expr, options) {
    const items = expr.split(",");
    let value = 0;

    return forEach(items, ref => {
      ref = ref.trim();

      const info = this._parseRef(vars, ref, options);

      return this._resolveRef(vars, info, options).then(resolvedValue => {
        if (resolvedValue !== undefined) {
          value = resolvedValue;
          return false;
        }
      });
    }).then(() => value);
  }

  // Parses a reference expression (i.e. `ref` in `${ref, def}`) of a variable
  // expression and returns an object with the parsed information.
  _parseRef(vars, ref, {expr}) {
    ref = ref.trim();

    let m = ref.match(VALUE_SYNTAX);

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

    m = ref.match(REF_SYNTAX);

    if (!m)
      throw error(VAR_SYNTAX_ERROR, {expr});

    return {
      type: "ref",
      source: m[1] || vars.defaultSource,
      path: decodeURI(m[2]),
      query: m[3] ? qs.parse(m[3]) : {}
    };
  }

  _resolveRef(vars, info, options) {
    let res;

    if (info.type === "value") {
      res = info.value;
    } else {
      const src = vars.getSource(info.source, options.expr);
      res = src.resolve(vars, info, options);
    }

    if (!isPromise(res))
      return Promise.resolve(res);

    return res;
  }
}

module.exports = VarExpr;
