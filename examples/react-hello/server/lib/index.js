"use strict";

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");

const PORT = process.env.PORT || 3000;

const args = serverArgs(process.argv.slice(2));

const app = express();

app.use(morgan("dev"));

let gourmet, opts;

if (args.watchMode) {
  const watch = require("@gourmet/watch-middleware");
  gourmet = require("@gourmet/client-lib");
  app.use(watch(args, gourmet));
  opts = {serverDir: args.serverDir};
} else {
  app.use("/s/", express.static(args.clientDir));
  if (process.env.RENDERER_URL) {
    gourmet = require("@gourmet/client-http");
    opts = {serverUrl: process.env.RENDERER_URL};
  } else if (process.env.RENDERER_LAMBDA) {
    gourmet = require("@gourmet/client-lambda");
    opts = {lambda: process.env.RENDERER_LAMBDA};   // Lambda function name or ARN
  } else {
    gourmet = require("@gourmet/client-lib");
    opts = {serverDir: args.serverDir};
  }
}

app.use(gourmet.getRenderer(Object.assign({
  entrypoint: "main",
  siloed: false,
  params: {
    message: "Hello"
  }
}, opts)));

const server = http.createServer(app);

server.on("listening", function() {
  const addr = server.address();
  const bind = "port " + addr.port;
  console.log("Server listening on " + bind);
});

server.listen(PORT);
