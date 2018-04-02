"use strict";

const http = require("http");
const express = require("express");
const morgan = require("morgan");
const gourmetClient = require("@gourmet/client");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(morgan("dev"));

app.use("/", gourmetClient({
  server: "http://localhost:8999"
}));

const server = http.createServer(app);

server.on("listening", function() {
  const addr = server.address();
  const bind = "port " + addr.port;
  console.log("Server listening on " + bind);
});

server.listen(PORT);
