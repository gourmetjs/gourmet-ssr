"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

module.exports = function(def) {
  const args = serverArgs(Object.assign({
    workDir: __dirname + "/..",
    outputDir: "../../.gourmet/builder-babel",
    debug: process.env.NODE_ENV !== "production"
  }, def));
  const app = express();

  if (args.debug)
    app.use(morgan("dev"));

  app.use(gourmet.middleware(args));

  app.get("*", (req, res) => {
    res.serve("main");
  });

  app.use(gourmet.errorMiddleware());

  app.server = app.listen(args.port, () => {
    if (args.debug)
      console.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
