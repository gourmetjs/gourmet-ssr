"use strict";

const npath = require("path");
const http = require("http");
const promiseProtect = require("@gourmet/promise-protect");
const connectLite = require("@gourmet/connect-lite");
const webpackDevMiddleware = require("webpack-dev-middleware");
const hotClient = require("webpack-hot-client");
const MemoryFs = require("memory-fs");
const serveStatic = require("serve-static");
const morgan = require("morgan");
const loadRenderer = require("@gourmet/load-renderer");
const handleRequestError = require("@gourmet/handle-request-error");

class GourmetPluginWebpackDevServer {
  constructor() {
    this._busy = {
      server: false,
      client: false,
      queue: []
    };
    this._renderers = {};
    this._lastCompilationHash = {};
  }

  _onCommand(context) {
    context.console.info("GourmetDevServer: executing 'serve' command...");

    const watch = context.argv.watch;

    if (watch === undefined || watch === "hot")
      context.watchMode = "hot";
    else if (watch === "mon")
      context.watchMode = true;
    else if (watch !== "off")
      throw Error("Unknown '--watch' option: " + watch);

    context.console.debug("context.watchMode:", context.watchMode);

    return context.plugins.runAsync("build:go", context).then(() => {
      this._runServer(context);
    });
  }

  _runServer(context) {
    const con = context.console;
    const serverCon = context.builds.server.console;
    const serverComp = context.builds.server.webpack.compiler;
    const clientComp = context.builds.client.webpack.compiler;
    const watchOptions = this._getWatchOptions(context.argv);

    // Simply calling `compiler.watch()` doesn't enable `memory-fs` in
    // `outputFileSystem`. It's the job of `webpack-dev-middleware` so we
    // have to manually configure it for the server.
    serverComp.outputFileSystem = new MemoryFs();

    this._runWatch(serverComp, watchOptions, (err, stats) => {
      this._printResult("server", err, stats, context).then(changed => {
        if (changed && !err && stats)
          this._invalidateServer();
        this._setBusy("server", !err && !stats, context);
      });
    });

    this._runWatch(clientComp, Object.assign({wrapWatcher: true}, watchOptions), (err, stats) => {
      this._printResult("client", err, stats, context).then(() => {
        this._setBusy("client", !err && !stats, context);
      });
    });

    hotClient(clientComp, {
      hot: context.watchMode === "hot"
    });

    const wdm = webpackDevMiddleware(clientComp, {
      publicPath: context.staticPrefix,
      index: false,
      reporter() {},
      logger: {
        error() {},
        warn() {},
        info: con.info,
        log: con.log
      }
    });
    const mlogs = serverCon.get("gourmet:http");

    this._connectApp = connectLite();

    this._connectApp.use(morgan("dev", {
      // Currently, morgan just use 'write' method of the output stream so
      // we can easily redirect output to our own console.
      stream: {
        write(text) {
          if (text.substr(-1) === "\n")
            text = text.substr(0, text.length - 1);
          mlogs.info(text);
        }
      }
    }));

    /*
    const clientDir = npath.join(context.builder.outputDir, context.stage, "client");
    const ssm = serveStatic(clientDir, {
      fallthrough: false,
      index: false,
      redirect: false
    });

    this._connectApp.use((req, res, next) => {
      if (req.url.startsWith(context.staticPrefix))
        ssm(req, res, next);
      else
        next();
    });
    */

    this._connectApp.use((req, res, next) => {
      if (this._isBusy()) {
        this._busy.queue.push(() => {
          return wdm(req, res, next);
        });
      } else {
        return wdm(req, res, next);
      }
    });

    this._connectApp.use((req, res) => {
      const entrypoint = req.headers["x-gourmet-endpoint"] || "main";
      const renderer = this._getRenderer({entrypoint}, context);
      renderer(req, res);
    });

    this._connectApp.use((err, req, res, next) => { // eslint-disable-line
      handleRequestError(err, req, res, {console: serverCon});
    });

    const host = context.argv.host || "0.0.0.0";
    const port = context.argv.port || 3939;

    this._httpServer = http.createServer(this._connectApp);

    this._httpServer.listen(port, host, () => {
      con.log(con.colors.brightYellow(`GourmetDevServer listening on port ${port}`));
    });
  }

  _isBusy() {
    return Boolean(this._busy.server || this._busy.client);
  }

  _setBusy(target, busy, context) {
    const oldBusy = this._isBusy();
    this._busy[target] = busy;
    const newBusy = this._isBusy();

    if (!newBusy && oldBusy !== newBusy) {
      const con = context.console;
      con.log(con.colors.green(">>>"));
      con.log(con.colors.green(">>> Bundles are ready to be served by both server and client"));
      con.log(con.colors.green(">>>"));
    }

    if (!newBusy && this._busy.queue.length) {
      const q = this._busy.queue;
      this._busy.queue = [];
      q.forEach(callback => callback());
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

  _invalidateServer() {
    this._renderers = {};
  }

  _printResult(target, err, stats, context) {
    const build = context.builds[target];
    const con = build.console;

    return promiseProtect(() => {
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
        con.log("Compilation finished, updating...");
        build.webpack.stats = stats;
        return build.finish(context).then(() => true);
      } else {
        con.log("Compilation hash didn't change, ignoring...");
        return false;
      }
    }).catch(err => {
      con.error(err);
    });
  }

  _getRenderer(params, context) {
    const key = JSON.stringify(params);
    let renderer = this._renderers[key];
    if (!renderer) {
      const serverDir = npath.join(context.builder.outputDir, context.stage, "server");
      const fs = context.builds.server.webpack.compiler.outputFileSystem;
      renderer = loadRenderer(Object.assign({serverDir, fs}, params));
      this._renderers[key] = renderer;
    }
    return renderer;
  }
}

GourmetPluginWebpackDevServer.meta = {
  commands: {
    "serve": {
      help: "Run the development server",
      options: {
        stage: {
          help: "Specify the stage (e.g. '--stage prod')",
          short: "s"
        },
        watch: {
          help: "Specify the watch mode ('hot*|mon|off')"
        },
        "watch-delay": {
          help: "Add a specified delay before rebuilding in watch mode (default: 300)"
        },
        "watch-poll": {
          help: "Use a polling with specified interval instead of monitoring in watch mode (default: 1000)"
        },
        "watch-ignore": {
          help: "Ignore a specified pattern from watching"
        }
        // Supports the same options as 'build' command
      }
    }
  },
  hooks: (proto => ({
    "command:serve": proto._onCommand
  }))(GourmetPluginWebpackDevServer.prototype)
};

module.exports = GourmetPluginWebpackDevServer;
