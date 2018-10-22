"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

module.exports = function(def) {
  const app = express();
  const args = app.args = serverArgs(Object.assign({
    workDir: __dirname + "/..",
    outputDir: "../../.gourmet/builder-basic",
    debug: process.env.NODE_ENV !== "production"
  }, def));

  if (args.debug)
    app.use(morgan("dev"));

  app.use(gourmet.middleware(args));

  app.use("/admin", (req, res) => {
    res.serve("admin", {abc: 456});
  });

  app.use("/", (req, res) => {
    res.serve("main", {xyz: 123});
  });

  app.use(gourmet.errorMiddleware());

  app.server = app.listen(args.port, () => {
    if (args.debug)
      console.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
