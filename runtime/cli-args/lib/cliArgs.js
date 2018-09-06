"use strict";

const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");

module.exports = function cliArgs(def={}, argv, options) {
  if (!argv)
    argv = camelcaseKeys(minimist(process.argv.slice(2)));

  const args = Object.keys(argv).reduce((obj, name) => {
    obj[name] = argv[name];
    return obj;
  }, {});

  Object.keys(def).forEach(name => {
    if (args[name] === undefined)
      args[name] = def[name];
  });

  const alias = (options && options.alias) || {};
  Object.keys(alias).forEach(name => {
    const list = alias[name];
    if (args[name] === undefined) {
      list.every(n => {
        if (args[n] !== undefined) {
          args[name] = args[n];
          return false;
        }
        return true;
      });
    }
  });

  return args;
};
