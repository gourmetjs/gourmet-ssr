"use strict";

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const gourmet = require("@gourmet/client-lib");
const serverArgs = require("@gourmet/server-args");
const handleRequestError = require("@gourmet/handle-request-error");

const PORT = process.env.PORT || 3000;

const args = serverArgs(process.argv.slice(2));

const app = express();

app.use(morgan("dev"));

if (args.watch) {
  const watch = require("@gourmet/watch-middleware")(args, gourmet);
  app.use(watch);
} else if (args.stage === "local") {
  app.use("/s/", express.static(args.clientDir, {
    fallthrough: false,
    index: false,
    redirect: false
  }));
}

app.get("/", (req, res, next) => {
  gourmet.render(req, res, next, {
    serverDir: args.serverDir,
    entrypoint: "main",
    siloed: false,
    params: {
      delay: 500
    }
  });
});

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
