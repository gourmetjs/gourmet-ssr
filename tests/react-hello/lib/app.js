"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");

module.exports = function(def, gourmet) {
  const args = serverArgs(Object.assign({
    workDir: __dirname + "/..",
    outputDir: "../../.gourmet/react-hello",
    debug: process.env.NODE_ENV !== "production"
  }, def));
  const app = express();

  if (args.debug)
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
    if (args.debug)
      console.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
