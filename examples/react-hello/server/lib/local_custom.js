"use strict";

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const gourmet = require("@gourmet/client-lib");
const serverArgs = require("@gourmet/server-args");
const handleRequestError = require("@gourmet/handle-request-error");

const PORT = process.env.PORT || 3000;

const args = serverArgs(process.argv.slice(2));
const {serverDir, clientDir, staticPrefix} = args;

const app = express();

app.use(morgan("dev"));

if (args.watch) {
  const watch = require("@gourmet/watch-middleware")(args, gourmet);
  app.use(watch);
} else {
  app.use(staticPrefix, gourmet.static({
    clientDir
  }));
}

app.use(gourmet.renderer({
  serverDir,
  entrypoint: "main"
}));

app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  handleRequestError(err, req, res, {
    debug: app.get("env") !== "production"
  });
});

const server = http.createServer(app);

server.on("listening", function() {
  console.log("Server listening on " + server.address().port);
});

server.listen(PORT);
