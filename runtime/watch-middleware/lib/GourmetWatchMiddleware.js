"use strict";

const GourmetCli = require("@gourmet/gourmet-cli-impl");
const inspectError = require("@gourmet/inspect-error");
const WatchServer = require("./WatchServer");

// --watch-port <n>: set the websocket port for watch mode (default: 3938)
// --watch-host <s>: set the websocket host for watch mode (default: "localhost")
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
    const watch = argv.watch;

    argv._ = ["build"];

    cli.init(argv).then(() => {
      cli.verifyArgs();
      cli.context.watch = watch;
      this._watchServer = new WatchServer(cli.context);
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
      this._handleComp("server", err, stats, context);
    });

    this._runWatch(clientComp, watchOptions, (err, stats) => {
      this._handleComp("client", err, stats, context);
    });

    //this._watchServer.run(clientComp);
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
    function _copy(src) {
      return {
        error: src.error,
        stats: src.stats,
        changed: src.changed
      };
    }

    const oldBusy = this._isCompiling();
    this._busy[target] = busy;
    const newBusy = this._isCompiling();

    if (!newBusy && oldBusy !== newBusy) {
      const server = _copy(context.builds.server.webpack);
      const client = _copy(context.builds.client.webpack);

      this._addToCompQueue(() => {
        if ()
        return context.builder.writeManifest(context, {
          server: server.stats,
          client: client.stats
        });

              if (changed && !err && stats)
        this.gourmet.cleanCache();

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

  _handleComp(target, err, stats, context) {
    const build = context.builds[target];
    const con = build.console;

    if (err) {
      build.webpack .error = err;
      build.webpack.stats = null;
      build.webpack.changed = true;

      con.error(err.stack || err);

      if (err.details)
        con.error(err.details);
    } else if (stats) {
      const assets = stats.compilation.assets;
      const changed = !Object.keys(assets).every(name => !assets[name].emitted);

      build.webpack.error = null;
      build.webpack.stats = stats;
      build.webpack.changed = changed;

      if (changed) {
        build.printResult(context);
      } else {
        con.log("No change...");
      }
    } else {
      con.log("Compiling...");
    }

    this._setBusy(target, !err && !stats, context);
  }
}

module.exports = GourmetWatchMiddleware;
