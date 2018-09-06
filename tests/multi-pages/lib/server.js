"use strict";

const express = require("express");
const morgan = require("morgan");
const gourmet = require("@gourmet/client-lib");
const serverArgs = require("@gourmet/server-args");
const errorMiddleware = require("@gourmet/error-middleware");

const args = serverArgs(process.argv.slice(2));

const app = express();

app.use(morgan("dev"));

app.use(gourmet.middleware(args));

app.get("/", (req, res) => {
  res.serve("main", {greeting: "Hello, world!"});
});

app.get("/dashboard", (req, res) => {
  res.serve("dashboard", {username: "admin"});
});

app.use(errorMiddleware({debug: args.debug}));

args.port = 3000;

app.listen(args.port, () => {
  console.log(`Server is listening on port ${args.port}...`);
});
