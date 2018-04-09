"use strict";

const stripAnsi = require("strip-ansi");
const getConsole = require("@gourmet/console");
const detect = require("@gourmet/console-env");

module.exports = function install(opts) {
  const base = getConsole();
  return getConsole.install(Object.assign({
    buffer: [],
    write(opts, text) {
      this.writeToBuffer(opts, stripAnsi(text));
      if (this.enabled(opts))
        this.writeToConsole(opts, text);
    },
    writeToBuffer(opts, text) {
      this.buffer.push([opts, text]);
    },
    writeToConsole(opts, text) {
      base.write(opts, text);
    },
    method(level) {
      return this.print.bind(this, {level});
    }
  }, detect(opts)));
};
