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
  constructor(options, ServerClass) {
    this.options = options;

    this.initConsole();

    con.debug("options:", this.options);

    if (ServerClass)
      this.ServerClass = ServerClass;
    else
      this.ServerClass = require("./GourmetHttpServer");
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
      useColors: parseArgs.bool(this.options.colors, parseArgs.undef),
      minLevel: parseArgs.verbosity([this.options.verbose, this.options.v]),
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
    const server = new this.ServerClass(this.options);
    server.start();
    return server;
  }

  getCount() {
    return parseArgs.number(this.options.count, os.cpus().length);
  }

  runMaster() {
    con.log("Master is running");

    const count = this.getCount();

    this.forkWorkers(count);

    cluster.on("exit", (worker, code, signal) => {
      con.warn(`Worker died: code=${code} signal=${signal}`);
    });
  }

  runWorker() {
    this.startHttpServer();
  }

  showHelp() {
    con.log(this.options.helpMessage || "No help");
  }

  run() {
    if (this.options.help || this.options.h)
      this.showHelp();
    else if (cluster.isMaster && this.getCount() > 1)
      this.runMaster();
    else
      this.runWorker();
  }
}

module.exports = GourmetServerLauncher;
