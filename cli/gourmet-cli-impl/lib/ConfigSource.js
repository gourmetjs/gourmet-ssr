"use strict";

const merge = require("@gourmet/plain-merge");

class ConfigSource {
  // Caller is responsible for preparing `upper` and 'lowwer' using
  // `prepareValue` based on the use case of object it gives.
  // If you give a raw object without preparing it with `prepareValue`,
  // it will be used just as-is, skipping any variable expansions.
  constructor(config, upper, lower) {
    this._config = config;
    this._upper = merge({}, upper);   // overriding values (e.g. cli options, env variables)
    this._lower = merge({}, lower);   // default value (e.g. set by plugins)
    this._isDirty = true;
  }

  async resolve(vars, info, options) {
    this._buildContext(vars);
    return vars.getNode(info.path, options);
  }

  addUpper(obj) {
    merge(this._upper, obj);
    this._isDirty = true;
  }

  addLower(obj) {
    merge(this._lower, obj);
    this._isDirty = true;
  }

  _buildContext(vars) {
    if (this._isDirty) {
      const config = merge({}, this._lower, this._config, this._upper);
      vars.setContext(config);
    }
  }
}

module.exports = ConfigSource;
