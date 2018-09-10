"use strict";

const gourmet = require("@gourmet/client-http");
const run = require("./app");

run({
  serverUrl: "http://localhost:3939/",
  workDir: __dirname + "/..",
  debug: process.env.NODE_ENV !== "production"
}, gourmet);
