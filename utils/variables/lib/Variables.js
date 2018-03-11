"use strict";

const repeat = require("promise-box/lib/repeat");
const merge = require("@gourmet/merge");

class Variables {
  constructor({
    rootObject,
    sources=[],

  }) {
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
    function _errorPath() {
      return paths.slice(0, idx).join(".");
    }

    if (!path || typeof path !== "string")
      return Promise.reject(error(INVALID_PATH, {path}));

    const paths = path.split(".");
    let val = this._data;
    let idx = 0;

    return repeat(() => {
      if (idx >= paths.length)
        return this._resolveAll(val);

      const name = paths[idx++];

      if (!name)
        throw error(INVALID_PATH, {path});

      if (merge.isPlainObject(val)) {
        if (options && options.strict && !val.hasOwnProperty(name))
          throw error(PROPERTY_NOT_FOUND, {path: _errorPath()});
        val = val[name];
      } else if (merge.isArray(val)) {
        const index = Number(name);
        if (Number.isNaN(index))
          throw error(INVALID_INDEX_VALUE, {path: _errorPath()});
        if (options && options.strict && (index < 0 || index >= val.length))
          throw error(INDEX_OUT_OF_RANGE, {path: _errorPath()});
        val = val[index];
      } else {
        throw error(OBJECT_OR_ARRAY_REQUIRED, {path: _errorPath()});
      }

      if (typeof val === "string") {
        return this._resolveOne(val).then(node => {

        });
      }
    });
  }

  eval(value) {

  }

  // Adds a variable source (instance of `VariableSource` class)
  addSource(source) {

  }
}

module.exports = Variables;
