"use strict";

require("./app")({
  workDir: __dirname + "/..",
  debug: process.env.NODE_ENV !== "production"
});
