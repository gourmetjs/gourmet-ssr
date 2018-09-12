"use strict";

const GourmetCli = require("@gourmet/gourmet-cli-impl");
const inspectError = require("@gourmet/inspect-error");

// --watch-port <n>: set the websocket port for watch mode (default: 3938)
// --watch-delay <n>: watchOptions.aggregateTimeout
// --watch-poll: watchOptions.poll
// --watch-ignore <p>: watchOptions.ignored
// * See https://webpack.js.org/configuration/watch/#watchoptions

class GourmetWatchMiddleware {
  constructor(gourmet) {
    if (!gourmet)
      throw Error("Instance of Gourmet Client is required");
    this.gourmet = gourmet;
    this._busy = {
      server: true,
      client: true,
      reqQueue: [],
      compQueue: []
    };
    this._lastCompilationHash = {};
    this._start();
  }

  handle(req, res, next) {
    if (this._isBusy()) {
      this._busy.reqQueue.push(next);
    } else {
      next();
    }
  }

  _start() {
    const cli = new GourmetCli();

    const argv = Object.assign({}, this.gourmet.baseOptions);
    const watch = argv.watch || true;

    argv._ = ["build"];

    cli.init(argv).then(() => {
      cli.verifyArgs();
      cli.context.watch = watch;
      return cli.context.plugins.runAsync("build:go", cli.context).then(() => {
        this._configureWatch(cli.context);
      });
    }).catch(err => {
      const con = cli.context.console;
      con.error(`Error occurred while initializing GourmetWatchMiddleware\n${inspectError(err, 1)}`);
    });
  }

  _configureWatch(context) {
    const serverComp = context.builds.server.webpack.compiler;
    const clientComp = context.builds.client.webpack.compiler;
    const watchOptions = this._getWatchOptions(context.argv);

    this._runWatch(serverComp, watchOptions, (err, stats) => {
      const changed = this._printResult("server", err, stats, context);
      if (changed && !err && stats)
        this.gourmet.cleanCache();
      this._setBusy("server", !err && !stats, context);
    });

    this._runWatch(clientComp, watchOptions, (err, stats) => {
      this._printResult("client", err, stats, context);
      this._setBusy("client", !err && !stats, context);
    });
  }

  _isBusy() {
    const busy = this._busy;
    return Boolean(busy.server || busy.client || busy.compQueue.length);
  }

  _isCompiling() {
    const busy = this._busy;
    return Boolean(busy.server || busy.client);
  }

  _setBusy(target, busy, context) {
    const oldBusy = this._isCompiling();
    this._busy[target] = busy;
    const newBusy = this._isCompiling();

    if (!newBusy && oldBusy !== newBusy) {
      const stats = {
        server: context.builds.server.webpack.stats,
        client: context.builds.client.webpack.stats
      };
      this._addToCompQueue(() => {
        return context.builder.writeManifest(context, stats);
      }, context);
    }
  }

  _addToCompQueue(func, context) {
    function _run() {
      const func = busy.compQueue[0];
      func().then(() => {
        _finish();
      }).catch(err => {
        con.error(err);
        _finish();
      });
    }

    function _finish() {
      busy.compQueue.shift();
      if (busy.compQueue.length)
        _run();
      else
        _flush();
    }

    function _flush() {
      con.log(con.colors.green(">>>"));
      con.log(con.colors.green(">>> Bundles are ready to be served!"));
      con.log(con.colors.green(">>>"));

      if (busy.reqQueue.length) {
        const q = busy.reqQueue;
        busy.reqQueue = [];
        q.forEach(callback => callback());
      }
    }

    const con = context.console;
    const busy = this._busy;

    busy.compQueue.push(func);

    if (busy.compQueue.length === 1)
      _run();
  }

  _runWatch(compiler, options, handler) {
    function _invalid(callback) {
      if (!compiling) {
        compiling = true;
        handler(null, null);
      }
      if (typeof callback === "function")
        callback();
    }

    function _done(stats) {
      setImmediate(() => {
        if (compiling) {
          compiling = false;
          handler(null, stats);
        }
      });
    }

    let compiling = false;

    compiler.hooks.invalid.tap("GourmetWatchMiddleware", _invalid);
    compiler.hooks.run.tap("GourmetWatchMiddleware", _invalid);
    compiler.hooks.done.tap("GourmetWatchMiddleware", _done);
    compiler.hooks.watchRun.tap("GourmetWatchMiddleware", (comp, callback) => {
      _invalid(callback);
    });

    compiler.watch(options, err => {
      if (err)
        handler(err);
    });
  }

  _getWatchOptions(argv) {
    const options = {};

    if (argv.watchDelay)
      options.aggregateTimeout = parseInt(argv.watchDelay, 300);

    if (argv.watchPoll)
      options.poll = argv.watchPoll;

    if (argv.watchIgnore)
      options.ignored = argv.watchIgnore;

    return options;
  }

  _printResult(target, err, stats, context) {
    const build = context.builds[target];
    const con = build.console;

    if (!err && !stats) {
      con.log("Compiling...");
      return false;
    }

    if (err) {
      con.error(err.stack || err);
      if (err.details)
        con.error(err.details);
      return false;
    }

    const hash = stats.compilation.hash;

    if (this._lastCompilationHash[target] !== hash) {
      this._lastCompilationHash[target] = hash;
      build.webpack.stats = stats;
      build.printResult(context);
      return true;
    } else {
      con.log("Compilation hash didn't change, ignoring...");
      return false;
    }
  }
}

module.exports = GourmetWatchMiddleware;
