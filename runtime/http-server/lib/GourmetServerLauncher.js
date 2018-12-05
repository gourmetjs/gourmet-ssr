"use strict";

const cluster = require("cluster");
const os = require("os");
const con = require("@gourmet/console")();

con.addFormatter((props, text) => {
  const color = con.colors.pick(cluster.isMaster ? "0" : "" + process.pid);
  return `${color}[${process.pid}]${con.colors.off.reset} ${text}`;
});

class GourmetServerLauncher {
  constructor(options, ServerClass) {
    this.options = options;

    con.debug("options:", this.options);

    if (ServerClass)
      this.ServerClass = ServerClass;
    else
      this.ServerClass = require("./GourmetHttpServer");
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
    return parseInt(this.options.count || os.cpus().length, 10);
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
    else if (!this.options.watch && cluster.isMaster && this.getCount() > 1)
      this.runMaster();
    else
      this.runWorker();
  }
}

module.exports = GourmetServerLauncher;
