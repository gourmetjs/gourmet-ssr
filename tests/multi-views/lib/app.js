"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

module.exports = function(def) {
  const args = serverArgs(def);
  const app = express();

  app.requestCount = 0;

  app.use((req, res, next) => {
    app.requestCount++;
    next();
  });

  if (args.debug)
    app.use(morgan("dev"));

  app.use(gourmet.middleware(args));

  app.get("*", (req, res) => {
    res.serve("main", {greeting: "Hello, world!"});
  });

  app.use(gourmet.errorMiddleware());

  app.server = app.listen(args.port, () => {
    if (args.debug)
      console.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
