"use strict";

const merge = require("@gourmet/plain-merge");
const Variables = require("@gourmet/variables");

class ConfigSource {
  // Caller is responsible for preparing `upper` and 'lowwer' using
  // `prepareValue` based on the use case of object it gives.
  // If you give a raw object without preparing it with `prepareValue`,
  // it will be used just as-is, skipping any variable expansions.
  constructor(upper, lower) {
    this._upper = merge({}, upper);   // overriding values (e.g. cli options, env variables)
    this._lower = merge({}, lower);   // default value (e.g. set by plugins)
  }

  async resolve(vars, info, options) {
    const items = [this._lower, vars._context, this._upper].map(context => {
      return vars.getNode(info.path, options, context).then(value => {
        return vars.resolveAllAndClone(value, info.path, undefined, options);
      });
    });
    const values = await Promise.all(items);
    return merge(...values);
  }

  addUpper(obj) {
    merge(this._upper, obj);
  }

  addLower(obj) {
    merge(this._lower, obj);
  }

  cleanCache() {
    this._upper = Variables.cleanCache(this._upper);
    this._lower = Variables.cleanCache(this._lower);
  }
}

module.exports = ConfigSource;
