"use strict";

const cluster = require("cluster");
const os = require("os");
const parseArgs = require("@gourmet/parse-args");
const getConsole = require("@gourmet/console");
const detect = require("@gourmet/console-env");

let con;

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
    getConsole.install(detect({
      useColors: parseArgs.bool(this.argv.colors),
      minLevel: parseArgs.verbosity(this.argv.verbose || this.argv.v)
    }));
    con = getConsole("gourmet:http");
  }

  forkWorkers(count) {
    for (let idx = 0; idx < count; idx++)
      cluster.fork();
  }

  startHttpServer() {
    const server = new this.ServerClass(this.args);
    server.start();
  }

  runMaster() {
    con.log(con.colors.brightYellow(`Master ${process.pid} is running`));

    const count = parseArgs.number(this.argv.count, os.cpus().length);

    this.forkWorkers(count);

    cluster.on("exit", (worker, code, signal) => {
      con.warn(con.colors.brightMagenta(`Worker ${worker.process.pid} died: code=${code} signal=${signal}`));
    });
  }

  runWorker() {
    con.log(con.colors.brightYellow(`Worker ${process.pid} is running`));
    this.startHttpServer();
  }

  showHelp() {
    con.log([
      "gourmet-http-server [options]",
      "",
      "  --dir, -d <d>        default: current directory",
      "  --stage, -s <s>      default: local",
      "  --out <s>            default: .gourmet",
      "  --port <n>           default: 3939",
      "  --host <h>           default: 0.0.0.0",
      "  --no-static          default: --static",
      "  --static-prefix <s>  default: /s/",
      "  --mount <s>          default: /",
      "  --entrypoint <s>     default: main",
      "  --siloed             default: --no-siloed",
      "  --params.x.y         same as {x: {y: true}}",
      "  --help, -h",
      "  --colors             default: auto detect",
      "  --verbose, -v <n>    debug|info|log|warn|error|0-5",
    ].join("\n"));
  }

  run() {
    this.initConsole();

    if (this.argv.help || this.argv.h)
      this.showHelp();
    else if (cluster.isMaster)
      this.runMaster();
    else
      this.runWorker();
  }
}

module.exports = GourmetServerLauncher;
