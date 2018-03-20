"use strict";

const error = require("@gourmet/error");
const Self = require("./sources/Self");
const Env = require("./sources/Env");
const Opt = require("./sources/Opt");
const File = require("./sources/File");
const VarNode = require("./VarNode");
const VarExpr = require("./VarExpr");
const VarGetter = require("./VarGetter");
const deepProp = require("./deepProp");
const deepClone = require("./deepClone");
const deepCloneSync = require("./deepCloneSync");

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
  constructor(context, {
    syntax=/(\\?)\${([^{}]+?)}/,
    defaultSource="self",
    handlerContext={}
  }={}) {
    this._sources = {};
    this.setContext(context);
    this.setSyntax(syntax);
    this.setDefaultSource(defaultSource);
    this.setHandlerContext(handlerContext);
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

  // Gets a property value of the context, resolving variable references to
  // concrete values. The result can be any JavaScript value, such as
  // string, number, object, array, ..etc.
  //
  // - [context] `{ bootstrap: {theme: "${sys:stage}-blue"} }`
  // - [code] `vars.get("bootstrap").then(boostrap => { console.log(JSON.stringify(bootstrap)) })`
  //    => `{theme: "dev-blue"}`
  // - [code] `vars.get("bootstrap.theme").then(theme => { console.log(JSON.stringify(theme)) })`
  //    => `"dev-blue"`
  //
  // options:
  //  - force: do not use a cached value
  //  - default: default value
  get(path, options={}) {
    return deepProp(this._context, path, (value, prop, parent) => {
      if (value instanceof VarNode)
        return value.resolve(this, prop, parent, path, options);
      else
        return value;
    }).then(value => {
      return this._resolveAllAndClone(value, path, options);
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
  eval(text, options={}) {
    if (typeof text !== "string")
      throw error(EVAL_STRING_REQUIRED);
    const node = new VarExpr(text);
    return node.resolve(this, null, null, "", options).then(value => {
      return this._resolveAllAndClone(value, "", options);
    });
  }

  // Same as `get` but stops resolving values at the node of `path` and
  // doesn't go any deeper. Not for end user but for the source development.
  getNode(path, options={}) {
    return deepProp(this._context, path, (value, prop, parent) => {
      if (value instanceof VarNode)
        return value.resolve(this, prop, parent, path, options);
      else
        return value;
    }).then(value => {
      return deepCloneSync(value, value => value);
    });
  }

  // Prepares a JavaScript value to be used as a part or entirety of an context.
  // Specifically, this wraps all text values with `VarExpr`.
  prepareValue(value) {
    return deepCloneSync(value, value => {
      if (typeof value === "string")
        return new VarExpr(value);
      else
        return value;
    });
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

  // Recursively resolves all the values and replace the literal forms to final
  // strings. This is used for creating a final deep copy of the value for
  // user consumption.
  _resolveAllAndClone(value, path, options) {
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

    return deepClone(value, path, (value, prop, parent, path) => {
      if (value instanceof VarNode) {
        return value.resolve(this, prop, parent, path, options).then(value => {
          return _replaceLiterals(value);
        });
      } else {
        return _replaceLiterals(value);
      }
    }).then(value => {
      if (value !== undefined)
        return value;
      return options.default;
    });
  }
}

Variables.getter = function(handler) {
  return new VarGetter(handler);
};

Variables.Self = Self;
Variables.Opt = Opt;
Variables.Env = Env;
Variables.File = File;

module.exports = Variables;
