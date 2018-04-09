"use strict";

const util = require("util");
const colors = require("@gourmet/colors");
const prefixLines = require("@gourmet/prefix-lines");

// 1 = debug, 2 = info, 3 = log, 4 = warn, 5 = error
const METHODS = ["debug", "info", "log", "warn", "error"];

function _levelIndex(method) {
  return typeof method === "string" ? (METHODS.indexOf(method) + 1) : Number(method);
}

function _noop() {
}

// base prototype
const proto = {
  print(opts={}, ...args) {
    const text = this.format(opts, args);
    this.write(opts, text);
  },

  format(opts, args) {
    const indent = opts.indent || this.indent || 0;
    let text = util.format.apply(util, args);
    if (indent)
      text = prefixLines(" ".repeat(indent), text);
    return text;
  },

  write(opts, text) {
    const level = _levelIndex(opts.level || this.level);
    if (level >= 4)
      process.stderr.write(text + "\n");
    else if (level > 0)
      process.stdout.write(text + "\n");
  },

  enabled(opts={}) {
    const level = _levelIndex(opts.level || this.level);
    const minLevel = _levelIndex(opts.minLevel || this.minLevel || 3);

    if (level < minLevel)
      return false;

    if (level >= 3)
      return true;  // namespaces only work for debug or info level

    const name = opts.name || this.name || "";
    const skips = this._skips, names = this._names;

    for (let idx = 0; idx < skips.length; idx++) {
      if (skips[idx].test(name))
        return false;
    }

    for (let idx = 0; idx < names.length; idx++) {
      if (names[idx].test(name))
        return true;
    }

    return false;
  },

  method(level) {
    const opts = {level};
    return this.enabled(opts) ? this.print.bind(this, opts) : _noop;
  },

  get(opts) {
    if (typeof opts === "string")
      opts = {name: opts};

    if (!opts && this.debug)
      return this;  // no need to create a new instance

    const con = Object.create(this);

    Object.assign(con, opts);

    con.colors = con.useColors ? colors : colors.disabled;

    if ((opts && opts.namespaces !== undefined) || !this._names) {
      // This part from 'https://github.com/visionmedia/debug'
      const items = (con.namespaces || "*").split(/[\s,]+/);
      con._names = [];
      con._skips = [];
      for (let idx = 0; idx < items.length; idx++) {
        if (!items[idx]) continue; // ignore empty strings
        const ns = items[idx].replace(/\*/g, ".*?");
        if (ns[0] === "-") {
          con._skips.push(new RegExp("^" + ns.substr(1) + "$"));
        } else {
          con._names.push(new RegExp("^" + ns + "$"));
        }
      }
    }

    METHODS.forEach((method, idx) => {
      con[method] = con.method(idx + 1);
    });

    return con;
  }
};

// Global singleton
let _console = proto;

function getConsole(opts) {
  return _console.get(opts);
}

getConsole.install = function(opts) {
  return getConsole.replace(getConsole(opts));
};

getConsole.replace = function(con) {
  return _console = con;
};

module.exports = getConsole;
