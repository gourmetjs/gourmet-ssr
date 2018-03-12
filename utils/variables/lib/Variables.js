"use strict";

const qs = require("querystring");
const repeat = require("promise-box/lib/repeat");
const merge = require("@gourmet/merge");
const error = require("@gourmet/error");

const VAR_INVALID_PATH = {
  message: "Invalid path '${path}', maybe a bug?",
  code: "VAR_INVALID_PATH"
};

const VAR_NON_STRING_MIX = {
  message: "Trying to populate non-string value into a string for variable '${var}'",
  code: "VAR_NON_STRING_MIX"
};

const VAR_SYNTAX_ERROR = {
  message: "Variable syntax error: ${expr}",
  code: "VAR_SYNTAX_ERROR"
};

const VAR_SOURCE_EXISTS = {
  message: "Variable source already exists: ${source}",
  code: "VAR_SOURCE_EXISTS"
};

const VAR_INVALID_SOURCE = {
  message: "Invalid source name '${source} in variable: ${expr}",
  code: "VAR_INVALID_SOURCE"
};

const VAR_PROPERTY_NOT_FOUND = {
  message: "Property doesn't exist at '${path}'",
  code: "VAR_PROPERTY_NOT_FOUND"
};

const REF_SYNTAX = /^(?:(?:(\w+):)?([\w-.~/%]+)(?:\?(.*))?)$/;
const VALUE_SYNTAX = /^(?:"([^"]*)"|'([^']*)'|([\d.]+)|(null|true|false))$/;

// Simple helper to replace a node in plain objects and arrays.
function _node(root) {
  let parent, prop;
  let current = root;
  return {
    get() {
      return current;
    },
    next(name) {
      parent = current;
      prop = name;
      return current = current[name];
    },
    replace(value) {
      return current = parent[prop] = value;
    }
  };
}

// Simple wrapper class to indicate a text value yet to be resolved.
class Unresolved {
  constructor(textValue) {
    this._textValue = textValue;
  }
}

class Variables {
  constructor({
    rootObject,
    sources=[],
    syntax=/(\$?)\${([\w-.~/%?=& '",]+?)}/,
    defaultSource="self"
  }) {
    this.syntax = syntax;
    this.defaultSource = defaultSource;

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
  get(path, options) {
    if (!path || typeof path !== "string")
      return Promise.reject(error(VAR_INVALID_PATH, {path}));

    const strict = options && options.strict;
    const paths = path.split(".");
    const node = _node(this._data);
    let value = node.get();
    let idx = 0;

    function _errorPath() {
      return paths.slice(0, idx).join(".");
    }

    return repeat(() => {
      if (idx >= paths.length)
        return this._resolveAll(value);

      const name = paths[idx++];

      if (!name)
        throw error(VAR_INVALID_PATH, {path});

      if (merge.isPlainObject(value)) {
        if (strict && !value.hasOwnProperty(name))
          throw error(VAR_PROPERTY_NOT_FOUND, {path: _errorPath()});
        value = node.next(name);
      } else if (merge.isArray(value)) {
        const index = Number(name);
        if (Number.isNaN(index))
          throw error(VAR_INVALID_INDEX_VALUE, {path: _errorPath()});
        if (strict && (index < 0 || index >= value.length))
          throw error(VAR_INDEX_OUT_OF_RANGE, {path: _errorPath()});
        value = node.next(index);
      } else {
        throw error(VAR_OBJECT_OR_ARRAY_REQUIRED, {path: _errorPath()});
      }

      if (value instanceof Unresolved) {
        return this._resolveValue(value, {strict}).then(resolvedValue => {
          value = node.replace(resolvedValue);
        });
      }
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

  // `value` must be an instance of `Unresolved`.
  _resolveValue(value, {strict}) {
    const literals = [];

    value = value._textValue;

    return repeat(() => {
      const m = value.match(this.syntax);

      if (!m)
        return value;

      const pos = m.index;
      const len = m[0].length;

      if (!m[1]) {
        return this._resolveExpr(m[2], {orgExpr: m[0], strict}).then(resolvedValue => {
          if (typeof resolvedValue !== "string") {
            if (pos === 0 && len === value.length && !literals.length) {
              value = resolvedValue;
              return value;
            } else {
              throw error(VAR_NON_STRING_MIX, {var: m[0]});
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
    }).then(value => {
      if (typeof value === "string")
        return literals.join("") + value;
      else
        return value;
    });
  }

  // Resolves an expression (i.e. `expr` in `${expr}') of a variable
  // reference to a concrete value.
  _resolveExpr(expr, options) {
    const items = expr.split(",");
    const ref = this._parseRefExpr(items[0] || "", options.orgExpr);
    return this._resolveRef(ref, options).then(value => {
      if (value === undefined) {
        const def = this._parseDefExpr(items[1] || "", options.orgExpr);
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
  _parseRefExpr(ref, orgExpr) {
    ref = ref.trim();

    const m = ref.match(REF_SYNTAX);

    if (!m)
      throw error(VAR_SYNTAX_ERROR, {expr: orgExpr});

    return {
      type: "ref",
      source: m[1] || this.defaultSource,
      path: decodeURI(m[2]),
      query: m[3] ? qs.parse(m[3]) : {}
    };
  }

  // Parses a default expression (i.e. `def` in `${ref, def}`) of a variable
  // reference and returns an object with the parsed information.
  _parseDefExpr(def, orgExpr) {
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

    return this._parseRefExpr(def, orgExpr);
  }

  _resolveRef(info, options) {
    const src = this._sources[info.source];

    if (!src)
      throw error(VAR_INVALID_SOURCE, {source: info.source, expr: options.orgExpr});

    return src.resolve(info, options);
  }
}

module.exports = Variables;
