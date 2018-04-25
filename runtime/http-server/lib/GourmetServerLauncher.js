"use strict";

const cluster = require("cluster");
const os = require("os");
const parseArgs = require("@gourmet/parse-args");
const getConsole = require("@gourmet/console");
const detect = require("@gourmet/console-env");

let con;

const COLORS = [
  31, // red
  32, // green
  33, // yellow
  //34, // blue
  36, // cyan
  91, // brightRed
  92, // brightGreen
  93, // brightYellow
  94, // brightBlue
  95, // brightMagenta
  96  // brightCyan
];

class GourmetServerLauncher {
  constructor(args, ServerClass) {
    this.args = args;
    this.argv = args.argv;

    this.initConsole();

    if (ServerClass)
      this.ServerClass = ServerClass;
    else
      this.ServerClass = require("../lib/GourmetHttpServer");
  }

  initConsole() {
    function _colVal(text) {
      if (cluster.isMaster)
        return 35; // magenta

      // https://github.com/visionmedia/debug/blob/22f993216dcdcee07eb0601ea71a917e4925a30a/src/common.js#L46

      let hash = 0;

      for (let idx = 0; idx < text.length; idx++) {
        hash  = ((hash << 5) - hash) + text.charCodeAt(idx);
        hash |= 0; // Convert to 32bit integer
      }

      return COLORS[Math.abs(hash) % COLORS.length];
    }

    function _color(text) {
      return con.colors.escape(_colVal(text)) + text + con.colors.off.reset;
    }

    const base = getConsole();

    getConsole.install(detect({
      useColors: parseArgs.bool(this.argv.colors, parseArgs.undef),
      minLevel: parseArgs.verbosity([this.argv.verbose, this.argv.v]),
      write(opts, text) {
        base.write(opts, `${_color("[" + process.pid + "]")} ${text}`);
      }
    }));

    con = getConsole("gourmet:net");
  }

  forkWorkers(count) {
    for (let idx = 0; idx < count; idx++)
      cluster.fork();
  }

  startHttpServer() {
    const server = new this.ServerClass(this.args);
    server.start();
    return server;
  }

  getCount() {
    return parseArgs.number(this.argv.count, os.cpus().length);
  }

  runMaster() {
    con.log("Master is running");
    con.debug("argv:", this.argv);

    const count = this.getCount();

    this.forkWorkers(count);

    cluster.on("exit", (worker, code, signal) => {
      con.warn(`Worker died: code=${code} signal=${signal}`);
    });
  }

  runWorker() {
    const server = this.startHttpServer();
    server.httpServer.on("listening", function() {
      const port = this.address().port;
      con.log(`Worker is listening on ${port}`);
    });
  }

  showHelp() {
    con.log([
      "gourmet-http-server [options]",
      "",
      "  --help, -h           Show this help screen",
      "  --dir, -d <d>        Set the working directory (default: current directory)",
      "  --stage, -s <s>      Set the stage (default: 'local')",
      "  --build <s>          Set the build directory (default: '.gourmet')",
      "  --port <n>           Set the listening port (default: '3939')",
      "  --host <h>           Set the listening host (default: '0.0.0.0')",
      "  --no-static          Do not serve static assets (default: '--static')",
      "  --static-prefix <s>  Set the path prefix of static assets (default: '/s/')",
      "  --mount <s>          Set the mounting path (default: '/')",
      "  --entrypoint <s>     Set the default entrypoint (default: 'main')",
      "  --siloed             Set the default 'siloed' option (default: '--no-siloed')",
      "  --params.x.y         Set the arbitrary 'params' object (result: '{x: {y: true}}')",
      "  --colors             Use ANSI colors in console output (default: auto detect)",
      "  --verbose, -v <n>    Set the verbosity level (debug|info|log*|warn|error|0-5)",
      "  --log-format <s>     Set the Morgan log format (dev*|combined|common|short|tiny|off)",
      "  --no-debug           Do not show details in error response (default: '--debug')"
    ].join("\n"));
  }

  run() {
    if (this.argv.help || this.argv.h)
      this.showHelp();
    else if (cluster.isMaster && this.getCount() > 1)
      this.runMaster();
    else
      this.runWorker();
  }
}

module.exports = GourmetServerLauncher;
