"use strict";

const express = require("express");
const morgan = require("morgan");
const gourmet = require("@gourmet/client-lib");
const serverArgs = require("@gourmet/server-args");
const errorHandler = require("@gourmet/error-middleware");

const args = serverArgs(process.argv.slice(2));

const app = express();

app.use(morgan("dev"));

app.use(gourmet.middleware(args));

app.get("/", (req, res, next) => {
  res.serve("main", {greeting: "Hello, world!"}, next);
});

app.get("/dashboard", (req, res, next) => {
  res.serve("dashboard", {username: "admin"}, next);
});

app.use(errorHandler({debug: args.debug}));

app.listen(args.port, () => {
  console.log(`Server is listening on port ${args.port}...`);
});
