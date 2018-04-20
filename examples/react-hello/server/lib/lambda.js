"use strict";

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const handleRequestError = require("@gourmet/handle-request-error");

const PORT = process.env.PORT || 3000;

const args = serverArgs(process.argv.slice(2));

const app = express();

app.use(morgan("dev"));

let gourmet, opts;

if (args.watch) {
  gourmet = require("@gourmet/client-lib");
  const watch = require("@gourmet/watch-middleware")(args, gourmet);
  app.use(watch);
  opts = {serverDir: args.serverDir};
} else if (args.stage === "dev") {
  gourmet = require("@gourmet/client-http");
  opts = {serverUrl: args.argv.serverUrl || "http://localhost:3939"};
} else if (args.stage === "prod") {
  gourmet = require("@gourmet/client-lambda");
  opts = {lambda: args.argv.lambda || process.env.RENDERER_LAMBDA};   // Lambda function name or ARN
} else {
  gourmet = require("@gourmet/client-lib");
  app.use("/s/", express.static(args.clientDir, {
    fallthrough: false,
    index: false,
    redirect: false
  }));
  opts = {serverDir: args.serverDir};
}

app.use(gourmet.getRenderer(Object.assign({
  path: "/",
  query: null,
  entrypoint: "main",
  siloed: false,
  params: {
    message: "Hello"
  }
}, opts)));

app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  handleRequestError(err, req, res);
});

const server = http.createServer(app);

server.on("listening", function() {
  const addr = server.address();
  const bind = "port " + addr.port;
  console.log("Server listening on " + bind);
});

server.listen(PORT);
