"use strict";

const npath = require("path");
const fs = require("fs");
const merge = require("@gourmet/merge");
const omit = require("@gourmet/omit");
const escapeScript = require("@gourmet/escape-script");
const promiseProtect = require("@gourmet/promise-protect");
const GourmetCli = require("@gourmet/gourmet-cli-impl");
const errorToString = require("@gourmet/error-to-string");
const WatchServer = require("./WatchServer");

// --watch-port <n>: set the websocket port for watch mode (default: 3938)
// --watch-host <s>: set the websocket host for watch mode (default: "localhost")
// --watch-reconnect: reconnect when failed (default)
// --watch-delay <n>: watchOptions.aggregateTimeout
// --watch-poll: watchOptions.poll
// --watch-ignore <p>: watchOptions.ignored
// * See https://webpack.js.org/configuration/watch/#watchoptions

class GourmetWatchMiddleware {
  static middleware(gourmet) {
    const m = new GourmetWatchMiddleware(gourmet);
    return GourmetWatchMiddleware.prototype.handle.bind(m);
  }

  static options(args) {
    return {
      port: args.watchPort || 3938,
      host: args.watchHost || "localhost",
      reconnect: args.watchReconnect
    };
  }

  static client(options) {
    const client = fs.readFileSync(npath.join(__dirname, "client.js.txt"), "utf8");
    const opts = Object.assign({
      serverUrl: `ws://${options.host}:${options.port}`
    }, omit(options, ["port", "host"]));
    const content = client.replace("__GOURMET_WATCH_OPTIONS__", JSON.stringify(opts));
    return `<script>${escapeScript(content)}</script>`;
  }

  constructor(gourmet) {
    if (!gourmet || !gourmet.cleanCache)
      throw Error("Instance of `gourmet/client-lib` is required");

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
    if (this.isBusy()) {
      this._busy.reqQueue.push(next);
    } else {
      next();
    }
  }

  isBusy() {
    const busy = this._busy;
    return Boolean(busy.server || busy.client || busy.compQueue.length);
  }

  _start() {
    const cli = new GourmetCli();

    const argv = Object.assign({}, this.gourmet.baseOptions);
    const options = GourmetWatchMiddleware.options(argv);

    argv._ = ["build"];

    cli.init(argv).then(() => {
      cli.verifyArgs();
      cli.context.watch = argv.watch;

      this._watchServer = new WatchServer(options, cli.context.console);

      this.gourmet.baseOptions = merge(this.gourmet.baseOptions, {
        context: {
          html: {
            headBottom: [
              GourmetWatchMiddleware.client(options)
            ]
          }
        }
      });

      return cli.context.plugins.runAsync("build:go", cli.context).then(() => {
        this._configureWatch(cli.context);
      });
    }).catch(err => {
      const con = cli.context.console;
      con.error(con.colors.brightRed(errorToString(err)));
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
        assetsSeq: src.assetsSeq
      };
    }

    const con = context.console;
    const oldBusy = this._isCompiling();
    this._busy[target] = busy;
    const newBusy = this._isCompiling();

    if (!newBusy && oldBusy !== newBusy) {
      const server = _copy(context.builds.server.webpack);
      const client = _copy(context.builds.client.webpack);

      this._addToCompQueue(() => {
        return promiseProtect(() => {
          if (server.stats && client.stats) {
            return context.builder.writeManifest(context, {
              server: server.stats,
              client: client.stats
            }).then(() => {
              this.gourmet.cleanCache();
            });
          }
        }).then(() => {
          if (server.error || client.error || server.stats.hasErrors() || client.stats.hasErrors()) {
            con.log(con.colors.brightRed(">>>"));
            con.log(con.colors.brightRed(">>> Compilation error(s)"));
            con.log(con.colors.brightRed(">>>"));
          } else {
            if (server.stats.hasWarnings() || client.stats.hasWarnings()) {
              con.log(con.colors.brightYellow(">>>"));
              con.log(con.colors.brightYellow(">>> Compilation warning(s)"));
              con.log(con.colors.brightYellow(">>>"));
            } else {
              con.log(con.colors.green(">>>"));
              con.log(con.colors.green(">>> Bundles are ready to be served!"));
              con.log(con.colors.green(">>>"));
            }
          }
          this._watchServer.notify(server, client);
        });
      }, con);
    }
  }

  _addToCompQueue(func, con) {
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
      if (busy.reqQueue.length) {
        const q = busy.reqQueue;
        busy.reqQueue = [];
        q.forEach(callback => callback());
      }
    }

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
      build.webpack.error = err;
      build.webpack.stats = null;

      con.error(err.stack || err);
    } else if (stats) {
      const oldHash = build.webpack.stats && build.webpack.stats.compilation.hash;
      const newHash = stats.compilation.hash;
      let changed = true;

      build.webpack.error = null;
      build.webpack.stats = stats;

      if (oldHash && oldHash === newHash) {
        const assets = stats.compilation.assets;
        const no_change = Object.keys(assets).every(name => !assets[name].emitted);
        if (no_change) 
          changed = false;
        else
          build.webpack.assetsSeq++;
      } else {
        build.webpack.assetsSeq = 0;
      }

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
