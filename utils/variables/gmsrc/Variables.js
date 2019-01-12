"use strict";

const error = require("@gourmet/error");
const deepClone = require("@gourmet/deep-clone");
const promiseMap = require("@gourmet/promise-map");
const promiseDeepClone = require("@gourmet/promise-deep-clone");
const promiseDeepProp = require("@gourmet/promise-deep-prop");
const Self = require("./sources/Self");
const Env = require("./sources/Env");
const Opt = require("./sources/Opt");
const File = require("./sources/File");
const VarNode = require("./VarNode");
const VarExpr = require("./VarExpr");
const VarGetter = require("./VarGetter");
const VarValue = require("./VarValue");

const VAR_SOURCE_EXISTS = {
  message: "Variable source already exists: ${source}",
  code: "VAR_SOURCE_EXISTS"
};

const INVALID_VAR_SOURCE = {
  message: "Invalid source name '${source} in variable: ${expr}",
  code: "INVALID_VAR_SOURCE"
};

const EVAL_STRING_REQUIRED = {
  message: "A text string must be provided to 'vars.eval()'",
  code: "EVAL_STRING_REQUIRED"
};

class Variables {
  constructor(context, options) {
    this.options = Object.assign({
      syntax: /(\\?)\${([^{}]+?)}/,
      defaultSource: "self",
      handlerContext: {},
      functionsAsGetters: false
    }, options);

    this._sources = {};

    this.setContext(context);
    this.setSyntax(this.options.syntax);
    this.setDefaultSource(this.options.defaultSource);
    this.setHandlerContext(this.options.handlerContext);
  }

  setContext(context) {
    this._context = this.prepareValue(context);
  }

  setSyntax(syntax) {
    this._syntax = syntax;
  }

  setDefaultSource(name) {
    this.defaultSource = name;
  }

  setHandlerContext(handlerContext) {
    this.handlerContext = handlerContext;
  }

  addBuiltinSources({env, argv, workDir}) {
    this.addSource("self", new Self());
    this.addSource("env", new Env(env));
    this.addSource("opt", new Opt(argv));
    this.addSource("file", new File(workDir));
  }

  // Gets a property value of the context using default source, resolving
  // variable references to concrete values.
  // The result can be any JavaScript value, such as string, number, object, array, ..etc.
  //
  // - [context] `{ bootstrap: {theme: "${sys:stage}-blue"} }`
  // - [code] `vars.get("bootstrap").then(boostrap => { console.log(JSON.stringify(bootstrap)) })`
  //    => `{theme: "dev-blue"}`
  // - [code] `vars.get("bootstrap.theme").then(theme => { console.log(JSON.stringify(theme)) })`
  //    => `"dev-blue"`
  //
  // options:
  //  - force: do not use a cached value
  get(path, defVal, options={}) {
    const src = this._sources[this.defaultSource];
    const info = {
      type: "ref",
      source: this.defaultSource,
      path,
      query: {}
    };
    return src.resolve(this, info, options).then(value => {
      return this.resolveAllAndClone(value, path, defVal, options);
    });
  }

  // Evaluates a text value, resolving variable references to
  // concrete values. The result can be any JavaScript value, such as
  // string, number, object, array, ..etc.
  //
  // - [context] `{greeting: "Hello"}`
  // - [code] `vars.eval("${greeting}, world!")`
  //    => `"Hello, world!"`
  //
  // See `get` for the options.
  eval(text, defVal, options={}) {
    if (typeof text !== "string")
      throw error(EVAL_STRING_REQUIRED);
    const node = new VarExpr(text);
    return node.resolve(this, null, null, "", options).then(value => {
      return this.resolveAllAndClone(value, "", defVal, options);
    });
  }

  getMulti(...args) {
    const paths = [];
    let options;

    for (let idx = 0; idx < args.length; idx++) {
      const arg = args[idx];
      if (typeof arg === "string") {
        paths.push([arg]);
      } else if (Array.isArray(arg)) {
        paths.push(arg);
      } else if (typeof arg === "object") {
        options = arg;
        break;
      } else {
        throw Error("Invalid argument");
      }
    }

    return promiseMap(paths, ([path, defVal]) => {
      return this.get(path, defVal, options);
    });
  }

  // Same as `get` but stops resolving values at the node of `path` and
  // doesn't go any deeper. Not for end user but for the source development.
  getNode(path, options={}, obj=this._context) {
    return promiseDeepProp(obj, path, (value, prop, parent) => {
      if (value instanceof VarNode)
        return value.resolve(this, prop, parent, path, options);
      else
        return value;
    }).then(value => {
      return deepClone(value);
    });
  }

  prepareValue(value) {
    return Variables.prepareValue(value, this.options);
  }

  // Adds a variable source (instance of `VariableSource` class)
  addSource(name, src) {
    if (this._sources[name])
      throw error(VAR_SOURCE_EXISTS, {source: name});
    this._sources[name] = src;
  }

  getSource(name, expr="") {
    const src = this._sources[name];
    if (!src)
      throw error(INVALID_VAR_SOURCE, {source: name, expr});
    return src;
  }

  cleanCache() {
    this._context = Variables.cleanCache(this._context);

    Object.keys(this._sources).forEach(name => {
      const source = this._sources[name];
      if (source.cleanCache)
        source.cleanCache(this);
    });
  }

  // Recursively resolves all the values and replace the literal forms to final
  // strings. This is used for creating a final deep copy of the value for
  // user consumption.
  resolveAllAndClone(value, path, defVal, options) {
    const _replaceLiterals = value => {
      if (typeof value !== "string")
        return value;

      const buf = [];

      for (;;) {
        const m = value.match(this._syntax);

        if (!m)
          break;

        const pos = m.index;
        const len = m[0].length;

        if (m[1]) {
          if (pos)
            buf.push(value.substr(0, pos));
          buf.push(value.substring(pos + m[1].length, pos + len));
        } else {
          buf.push(value.substr(0, pos + len));
        }

        value = value.substr(pos + len);
      }

      return buf.join("") + value;
    };

    return promiseDeepClone(value, path, (value, prop, parent, path) => {
      if (value instanceof VarNode) {
        return value.resolve(this, prop, parent, path, options).then(value => {
          return _replaceLiterals(value);
        });
      } else {
        return _replaceLiterals(value);
      }
    }).then(value => {
      return value === undefined ? defVal : value;
    });
  }
}

// Prepares a JavaScript value to be used as a part or entirety of an context.
// Specifically, this wraps all text values with `VarExpr`.
Variables.prepareValue = function(value, options={}) {
  return deepClone(value, value => {
    if (typeof value === "string")
      return new VarExpr(value);
    else if (options.functionsAsGetters && typeof value === "function")
      return new VarGetter(value);
    else
      return value;
  });
};

Variables.cleanCache = function(value) {
  return deepClone(value, value => {
    if (value instanceof VarExpr)
      value.cleanCache();
    return value;
  });
};

// You should use this wrapper if `functionsAsAsGetters` is not set and you
// want to use a function as getter.
Variables.getter = function(handler) {
  return new VarGetter(handler);
};

// You should use this wrapper if `functionsAsAsGetters` is set and you
// want to give a real function object, not a getter.
// Also, this can be used to wrap a string literal to bypass interpolation.
Variables.value = function(value) {
  return new VarValue(value);
};

Variables.Self = Self;
Variables.Opt = Opt;
Variables.Env = Env;
Variables.File = File;

module.exports = Variables;
