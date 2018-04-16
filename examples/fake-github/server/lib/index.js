"use strict";

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");

const PORT = process.env.PORT || 3000;

const args = serverArgs(process.argv.slice(2));

const app = express();

app.use(morgan("dev"));

let gourmet;

if (args.watch) {
  const watch = require("@gourmet/watch-middleware")(args);
  app.use(watch);
  gourmet = watch.client;
} else {
  gourmet = require("@gourmet/client-lib")();
  app.use("/s/", express.static(args.clientDir));
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

const server = http.createServer(app);

server.on("listening", function() {
  const addr = server.address();
  const bind = "port " + addr.port;
  console.log("Server listening on " + bind);
});

server.listen(PORT);
