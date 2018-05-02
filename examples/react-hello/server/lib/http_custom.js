"use strict";

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const gourmet = require("@gourmet/client-http");
const serverArgs = require("@gourmet/server-args");
const handleRequestError = require("@gourmet/handle-request-error");

const PORT = process.env.PORT || 3000;

const {argv, staticPrefix} = serverArgs(process.argv.slice(2));
const serverUrl = argv.serverUrl || "http://localhost:3939";

const app = express();

app.use(morgan("dev"));

app.use(staticPrefix, gourmet.static({
  serverUrl
}));

app.use(gourmet.renderer({
  serverUrl,
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
