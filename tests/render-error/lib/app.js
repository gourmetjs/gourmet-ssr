"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

module.exports = function(def, errorOptions) {
  const args = serverArgs(def);
  const app = express();

  if (args.debug)
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

  app.use(gourmet.errorMiddleware(errorOptions));

  app.server = app.listen(args.port, () => {
    if (args.debug)
      console.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
