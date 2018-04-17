"use strict";

const promiseProtect = require("@gourmet/promise-protect");
const webpackDevMiddleware = require("webpack-dev-middleware");
const hotClient = require("webpack-hot-client");
const MemoryFs = require("memory-fs");
const GourmetCli = require("@gourmet/gourmet-cli-impl");
const clientLib = require("@gourmet/client-lib");
const StorageFs = require("@gourmet/storage-fs");

class GourmetWatchMiddleware {
  constructor(options) {
    this._busy = {
      server: true,
      client: true,
      queue: []
    };
    this._lastCompilationHash = {};
    this._start(options);
  }

  handle(req, res, next) {
    if (this._isBusy()) {
      this._busy.queue.push(() => {
        return this._webpackDevMiddleware(req, res, next);
      });
    } else {
      return this._webpackDevMiddleware(req, res, next);
    }
  }

  _start({watch, workDir}) {
    const cli = new GourmetCli();
    const argv = Object.assign(cli.parseArgs(process.argv.slice(2)), {workDir, command: "build"});

    if (!argv.watchFs)
      this._outputFileSystem = new MemoryFs();

    this.gourmet = clientLib(new StorageFs({fs: this._outputFileSystem}));

    cli.init(argv).then(() => {
      cli.verifyArgs(argv, cli.findCommandInfo(argv.command));
      cli.context.watch = watch;
      return cli.context.plugins.runAsync("build:go", cli.context).then(() => {
        this._webpackDevMiddleware = this._configureWatch(cli.context);
      });
    }).catch(err => {
      const con = cli.context.console;
      con.error(err);
    });
  }

  _configureWatch(context) {
    const clientCon = context.builds.client.console;
    const serverComp = context.builds.server.webpack.compiler;
    const clientComp = context.builds.client.webpack.compiler;
    const watchOptions = this._getWatchOptions(context.argv);

    serverComp.outputFileSystem = context.builder.serverOutputFileSystem = this._outputFileSystem;

    this._runWatch(serverComp, watchOptions, (err, stats) => {
      const changed = this._printResult("server", err, stats, context);
      if (changed && !err && stats)
        this.gourmet.cleanCache();
      this._setBusy("server", !err && !stats, context);
    });

    this._runWatch(clientComp, Object.assign({wrapWatcher: true}, watchOptions), (err, stats) => {
      this._printResult("client", err, stats, context);
      this._setBusy("client", !err && !stats, context);
    });

    hotClient(clientComp, {
      hot: context.watch === "hot",
      port: context.argv.watchPort || 3938
    });

    return webpackDevMiddleware(clientComp, {
      publicPath: context.staticPrefix,
      index: false,
      reporter() {},
      logger: {
        error() {},
        warn() {},
        info: clientCon.info,
        log: clientCon.log
      }
    });
  }

  _isBusy() {
    return Boolean(this._busy.server || this._busy.client);
  }

  _setBusy(target, busy, context) {
    const con = context.console;
    const oldBusy = this._isBusy();
    this._busy[target] = busy;
    const newBusy = this._isBusy();

    if (!newBusy && oldBusy !== newBusy) {
      context.builder.writeManifest(context);

      con.log(con.colors.green(">>>"));
      con.log(con.colors.green(">>> Bundles are ready to be served by both server and client"));
      con.log(con.colors.green(">>>"));

      if (this._busy.queue.length) {
        const q = this._busy.queue;
        this._busy.queue = [];
        q.forEach(callback => callback());
      }
    }
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

    compiler.hooks.invalid.tap("GourmetDevServer", _invalid);
    compiler.hooks.run.tap("GourmetDevServer", _invalid);
    compiler.hooks.done.tap("GourmetDevServer", _done);
    compiler.hooks.watchRun.tap("GourmetDevServer", (comp, callback) => {
      _invalid(callback);
    });

    if (options.wrapWatcher) {
      delete options.wrapWatcher;
      const oldWatch = compiler.watch.bind(compiler);
      compiler.watch = (options, callback) => {
        return oldWatch(options, (err, stats) => {
          if (err)
            handler(err);
          callback(err, stats);
        });
      };
    } else {
      compiler.watch(options, err => {
        if (err)
          handler(err);
      });
    }
  }

  _getWatchOptions(argv) {
    const options = {};

    if (argv.watchDelay)
      options.aggregateTimeout = parseInt(argv.watchDelay, 10);

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
      build.printWebpackResult(context);
      return true;
    } else {
      con.log("Compilation hash didn't change, ignoring...");
      return false;
    }
  }
}

module.exports = GourmetWatchMiddleware;
