"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");
const con = require("@gourmet/console")();

module.exports = function(def) {
  const args = serverArgs(Object.assign({
    workDir: __dirname + "/..",
    outputDir: "../../.gourmet/render-error"
  }, def));
  const app = express();

  if (con.enabled("log"))
    app.use(morgan("dev"));

  app.use(gourmet.middleware(args));

  app.get("/", (req, res) => {
    res.serve("client_error");
  });

  app.get("/server-error", (req, res) => {
    res.serve("server_error");
  });

  app.get("/init-error", (req, res) => {
    res.serve("init_error");
  });

  app.use(gourmet.errorMiddleware());

  app.server = app.listen(args.port, () => {
    con.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
