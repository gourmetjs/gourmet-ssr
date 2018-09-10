"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const errorMiddleware = require("@gourmet/error-middleware");

module.exports = function(def, gourmet) {
  const args = serverArgs(def);
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

  app.use(errorMiddleware({debug: args.debug}));

  app.server = app.listen(args.port, () => {
    if (args.debug)
      console.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};