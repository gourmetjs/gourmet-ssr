"use strict";

const tty = require("tty");
const {format} = require("util");
const isPlainObject = require("@gourmet/is-plain-object");
const prefixLines = require("@gourmet/prefix-lines");
const stripAnsi = require("strip-ansi");
const colors = require("@gourmet/colors");
const minimist = require("minimist");

const OFF = 0;
const ERROR = 1;
const WARN = 2;
const LOG = 3;
const INFO = 4;
const DEBUG = 5;

const METHODS = {
  "off": OFF,
  "error": ERROR,
  "warn": WARN,
  "log": LOG,
  "info": INFO,
  "debug": DEBUG,
  "0": OFF,
  "1": ERROR,
  "2": WARN,
  "3": LOG,
  "4": INFO,
  "5": DEBUG
};

function _level(level) {
  level = typeof level === "string" ? METHODS[level] : Number(level);
  if (typeof level !== "number")
    throw Error("Invalid level value: " + level);
  return level;
}

function _get2(a, b) {
  return a === undefined ? b : a;
}

function _getn(...args) {
  for (let idx = 0, len = args.length; idx < len; idx++)
    if (args[idx] !== undefined)
      return args[idx];
}

function _noop() {
}

class Console {
  constructor(options) {
    this.options = this.getDefaultOptions();
    this.reset(options);
  }

  // Resets this console instance with the given configuration options on top of current options:
  // - level: default level to apply if not specified (default: LOG)
  // - verbosity: console verbosity level (string or number, default: LOG)
  // - capture: buffer verbosity level (string or number, default: OFF)
  // - stripAnsi: true, false, "buffer", "console" (default: "buffer")
  // - colors: true, false (default: auto-detected)
  // - indent: base indentation (default: 0)
  // - debugFilter: Filter spec for DEBUG level output (default: "*")
  //
  // The following environment variables can be used to change default options:
  // - GOURMET_VERBOSITY: same as `verbosity`
  // - GOURMET_COLORS: same as `colors: true` if non-empty string is given
  // - GOURMET_DEBUG: same as `debugFilters`
  //
  // The following command line options can be used to override environment variables or default values:
  // - `--verbosity level`, `--verbose level`, `-v level`: Same as `verbosity`
  // - `--colors`, `--no-colors`: Same as `colors`
  // - `--debug-filter filter`: Same as `debugFilter`
  reset(options) {
    this.options = Object.assign(this.options, options);

    this.options.verbosity = _level(this.options.verbosity);
    this.options.capture = _level(this.options.capture);

    this.colors = this.options.colors ? colors : colors.disabled;

    if (this.options.capture && !this.buffer)
      this.buffer = [];

    this._addMethods(this, {});

    if (!this._formatters)
      this._formatters = [];

    this._matches = [];
    this._skips = [];

    const items = this.options.debugFilter.split(/[\s,]+/);
    for (let idx = 0; idx < items.length; idx++) {
      if (items[idx]) {
        const tag = items[idx].replace(/\*/g, ".*?");
        if (tag[0] === "-")
          this._skips.push(new RegExp("^" + tag.substr(1) + "$"));
        else
          this._matches.push(new RegExp("^" + tag + "$"));
      }
    }
  }

  // Gets the default configuration options.
  // Can be overridden for heavy customization.
  getDefaultOptions() {
    const argv = minimist(process.argv.slice(2));
    return {
      level: LOG,     //Level to apply if not specified
      verbosity: _getn(argv.verbosity, argv.verbose, argv.v, process.env.GOURMET_VERBOSITY, LOG),
      capture: OFF,
      stripAnsi: "buffer",  // Strip ANSI escapes when capturing
      colors: _getn(argv.colors, process.env.GOURMET_COLORS, process.stdout && tty.isatty(process.stdout.fd), false),
      indent: 0,
      debugFilter: _getn(argv["debug-filter"], process.env.GOURMET_DEBUG, "*")
    };
  }

  // Highest layer logging function.
  // `print([props0, props1...], ...args)`
  // - Properties must be plain objects, and they are merged in the given order.
  // - Note that you specify properties, not configuration options here.
  //   Configuration options must be set through `reset()`.
  //   - level, indent, tag
  //   - Other custom properties that should be handed over to `toConsole` or `toBuffer`.
  print(...args) {
    let props = isPlainObject(args[0]) ? args.shift() : {};

    if (props.__flag === undefined)
      props = this._process(props);

    if (props.__flag) {
      const strip = this.options.stripAnsi;
      let text = this.format(props, args);

      if (strip === true)
        text = stripAnsi(text);

      if (props.__flag & 1)
        this.toConsole(props, strip === "console" ? stripAnsi(text) : text);

      if (props.__flag & 2) {
        if (this.buffer) {
          delete props.__flag;   // quick patch to prevent this from appearing in buffered logs
          this.toBuffer(props, strip === "buffer" ? stripAnsi(text) : text);
        }
      }
    }
  }

  // Middle layer formatting function.
  // This function is responsible for applying `indent`, formatters, and `printf` style arguments
  // formatting using Node's `util.format` function.
  format(props, args) {
    const indent = this.options.indent + (props.indent || 0);
    let text = format(...args);

    if (indent)
      text = prefixLines(" ".repeat(indent), text);

    const fns = this._formatters;
    for (let idx = 0, len = fns.length; idx < len; idx++) {
      const fn = fns[idx];
      text = fn.call(this, props, text);
    }

    return text;
  }

  // Formatters are of `fn(props, text)` shape, and chained together with the return value of
  // previous function being given as `text` parameter to the next function.
  // `props` is guaranteed to be a plain object with `level` coerced to a number.
  addFormatter(fn) {
    this._formatters.push(fn);
  }

  // Lowest level output function to the console.
  // `props` is guaranteed to be a plain object with `level` coerced to a number.
  toConsole(props, text) {
    const level = props.level;
    if (level === ERROR)
      console.error(text);
    else if (level === WARN)
      console.warn(text);
    else if (level === INFO || level === DEBUG)
      console.info(text);
    else
      console.log(text);
  }

  // Lowest level output function to the buffer.
  // `props` is guaranteed to be a plain object with `level` coerced to a number.
  toBuffer(props, text) {
    this.buffer.push([props, text]);
  }

  // Check if the given method (string name such as "debug") is enabled for
  // logging. Please be aware that, even if the console output is disabled for a level, the
  // method for the level can still be enabled because of the buffering.
  enabled(method) {
    return this[method] !== _noop;
  }

  // Creates a lightweight console object carrying the given properties when you are using
  // level specific methods such as `log` or `debug`.
  // The actual logging is still performed though this console instance.
  create(props) {
    const con = Object.create(this);
    this._addMethods(con, props);
    return con;
  }

  // Creates a bound function carrying the properties.
  method(props) {
    props = this._process(props);
    if (!props.__flag)
      return _noop;
    else
      return this.print.bind(this, props);
  }

  getDebug(tag) {
    return this.method({level: "debug", tag});
  }

  _addMethods(obj, props) {
    ["debug", "info", "log", "warn", "error"].forEach(method => {
      obj[method] = this.method(Object.assign(props, {level: method}));
    });
  }

  _process(props) {
    props = Object.assign({}, props);

    props.__flag = 0;
    props.level = _level(_get2(props.level, this.options.level));

    if (props.level <= this.options.verbosity) {
      // Tag filtering only applies to the debug level logging to the console.
      if (props.level !== DEBUG || !props.tag || this._checkTag(props.tag))
        props.__flag |= 1;
    }

    if (props.level <= this.options.capture)
      props.__flag |= 2;

    return props;
  }

  _checkTag(tag) {
    const skips = this._skips;
    const matches = this._matches;

    for (let idx = 0; idx < skips.length; idx++) {
      if (skips[idx].test(tag))
        return false;
    }

    for (let idx = 0; idx < matches.length; idx++) {
      if (matches[idx].test(tag))
        return true;
    }

    return false;
  }
}

Console.prototype.OFF = OFF;
Console.prototype.ERROR = ERROR;
Console.prototype.WARN = WARN;
Console.prototype.LOG = LOG;
Console.prototype.INFO = INFO;
Console.prototype.DEBUG = DEBUG;

module.exports = Console;
