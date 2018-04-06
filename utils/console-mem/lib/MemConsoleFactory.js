"use strict";

const stripAnsi = require("strip-ansi");
const detectOptions = require("@gourmet/console-env/lib/detectOptions");
const ConsoleFactory = require("@gourmet/console/lib/ConsoleFactory");

class MemConsoleFactory extends ConsoleFactory {
  constructor(options) {
    super({minLevel: "debug", namespaces: "*", useColors: detectOptions().useColors});
    this.con = options.console || new ConsoleFactory(detectOptions(options));
    this.buffer = [];
  }

  flush(info, text) {
    this.buffer.push([info, stripAnsi(text)]);
    if (this.con.enabled(info))
      this.con.flush(info, text);
  }
}

module.exports = MemConsoleFactory;
