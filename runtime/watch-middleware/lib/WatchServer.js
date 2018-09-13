"use strict";

module.exports = class WatchServer {
  constructor(context) {
    this.context = context;
  }

  run(compiler) {
    const con = this.context.console;

    function _compile() {
      con.log(con.colors.green("[watch] compiling..."));
      _send("compile");
    }

    function _invalid(path) {
      con.log(con.colors.green("[watch] invalidate..."));
      _send("invalid");
    }

    function _done(stats) {
      con.log(con.colors.green("[watch] compilation done."));
      
    }

    compiler.hooks.compile.tap("GourmetWatchMiddleware", _compile);
    compiler.hooks.invalid.tap("GourmetWatchMiddleware", _invalid);
    compiler.hooks.done.tap("GourmetWatchMiddleware", _done);
  }
};
