"use strict";

const util = require("util");
const colors = require("@gourmet/colors");
const prefixLines = require("@gourmet/prefix-lines");

// 1 = debug, 2 = info, 3 = log, 4 = warn, 5 = error
const METHODS = ["debug", "info", "log", "warn", "error"];

// Global singleton
let _console;

function _levelIndex(method) {
  return typeof method === "string" ? (METHODS.indexOf(method) + 1) : Number(method);
}

function _noop() {
}

// base prototype
const proto = {
  writeln(info={}, ...args) {
    const text = this.format(info, args);
    this.flush(info, text);
  },

  format(opts, args) {
    const indent = opts.indent || this.indent || 0;
    let text = util.format.apply(util, args);
    if (indent)
      text = prefixLines(" ".repeat(indent), text);
    return text;
  },

  flush(opts, text) {
    const level = _levelIndex(opts.level || this.level);
    if (level >= 4)
      process.stderr.write(text + "\n");
    else if (level > 0)
      process.stdout.write(text + "\n");
  },

  enabled(opts={}) {
    const level = _levelIndex(opts.level || this.level);

    if (level < this.minLevel)
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

  get(options) {
    if (typeof options === "string")
      options = {name: options};

    const con = Object.create(this);

    con.factory = this;
    con.options = Object.assign({}, this.options, options);

    METHODS.forEach((method, idx) => {
      const minfo = {level: idx + 1};
      con[method] = con.enabled(minfo) ? con.writeln.bind(con, minfo) : _noop;
    });

    return con;
  },

  install(con) {
    _console = con;
  }
};

class ConsoleFactory {
  constructor(options={}) {
    Object.assign(this, options);

    this.minLevel = _levelIndex(this.minLevel === undefined ? "log" : this.minLevel);
    this.colors = this.useColors ? colors : colors.disabled;
    this.baseInfo = this.baseInfo || {};

    // This part from 'https://github.com/visionmedia/debug'
    const items = (this.namespaces || "*").split(/[\s,]+/);
    this._names = [];
    this._skips = [];
    for (let idx = 0; idx < items.length; idx++) {
      if (!items[idx]) continue; // ignore empty strings
      const ns = items[idx].replace(/\*/g, ".*?");
      if (ns[0] === "-") {
        this._skips.push(new RegExp("^" + ns.substr(1) + "$"));
      } else {
        this._names.push(new RegExp("^" + ns + "$"));
      }
    }
  }

}

ConsoleFactory.methods = METHODS;
ConsoleFactory.levelIndex = _levelIndex;

module.exports = ConsoleFactory;
