"use strict";

const express = require("express");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

const args = serverArgs({workDir: __dirname + "/.."});
const app = express();

app.use(gourmet.middleware(args));

app.get("*", (req, res) => {
  res.serve("main");
});

app.use(gourmet.errorMiddleware());

app.listen(args.port, () => {
  console.log(`Server is listening on port ${args.port}...`);
});
