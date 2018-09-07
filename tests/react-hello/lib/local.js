"use strict";

const gourmet = require("@gourmet/client-lib");
const run = require("./app");

run({
  workDir: __dirname + "/..",
  debug: process.env.NODE_ENV !== "production"
}, gourmet);
