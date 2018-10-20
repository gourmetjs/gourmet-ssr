"use strict";

const merge = require("@gourmet/merge");
const deepClone = require("@gourmet/deep-clone");

class ConfigSource {
  // Caller is responsible for preparing `upper` and 'lowwer' using
  // `prepareValue` based on the use case of object it gives.
  // If you give a raw object without preparing it with `prepareValue`,
  // it will be used just as-is, skipping any variable expansions.
  constructor(upper, lower) {
    this._upper = deepClone(upper || {});   // overriding values (e.g. cli options, env variables)
    this._lower = deepClone(lower || {});   // default value (e.g. set by plugins)
  }

  async resolve(vars, info, options) {
    let value = await vars.getNode(info.path, options, this._upper);
    if (value === undefined) {
      value = await vars.getNode(info.path, options);
      if (value === undefined)
        value = await vars.getNode(info.path, options, this._lower);
    }
    return value;
  }

  addUpper(obj) {
    merge(this._upper, obj);
  }

  addLower(obj) {
    merge(this._lower, obj);
  }

  cleanCache(vars) {
    const Variables = vars.constructor;
    this._upper = Variables.cleanCache(this._upper);
    this._lower = Variables.cleanCache(this._lower);
  }
}

module.exports = ConfigSource;
