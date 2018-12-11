"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const con = require("@gourmet/console")();

module.exports = function(def, gourmet) {
  const args = serverArgs(Object.assign({
    workDir: __dirname + "/..",
    outputDir: "../../.gourmet/react-hello"
  }, def));
  const app = express();

  if (con.enabled("log"))
    app.use(morgan("dev"));

  app.use(gourmet.middleware(args));

  app.get("/", (req, res) => {
    res.serve("main", {greeting: "Hello, world!"});
  });

  app.get("/dashboard", (req, res) => {
    res.serve("dashboard", {username: "admin"});
  });

  app.use(gourmet.errorMiddleware());

  app.server = app.listen(args.port, () => {
    con.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
