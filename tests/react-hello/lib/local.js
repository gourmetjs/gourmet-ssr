"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");
const errorMiddleware = require("@gourmet/error-middleware");

const args = serverArgs({
  workDir: __dirname + "/..",
  debug: process.env.NODE_ENV !== "production"
});

const app = express();

if (args.debug)
  app.use(morgan("dev"));

app.use(gourmet.middleware(args));

app.get("/", (req, res) => {
  res.serve("main");
});

app.use(errorMiddleware({debug: args.debug}));

app.listen(args.port, () => {
  if (args.debug)
    console.log(`Server is listening on port ${args.port}...`);
});
