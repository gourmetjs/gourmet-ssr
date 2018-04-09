"use strict";

const npath = require("path");
const http = require("http");
const express = require("express");
const morgan = require("morgan");
const loadRenderer = require("@gourmet/load-renderer");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(morgan("dev"));

app.use("/s", express.static(npath.resolve(__dirname, "../../react-hello/.gourmet/dev/client"), {
  fallthrough: false
}));

const renderer = loadRenderer({
  serverDir: npath.join(__dirname, "../../react-hello/.gourmet/dev/server")
});

// Should be changed to render API
app.use("/", (req, res) => {
  req.url = req.originalUrl || req.url;
  renderer(req, res);
});

const server = http.createServer(app);

server.on("listening", function() {
  const addr = server.address();
  const bind = "port " + addr.port;
  console.log("Server listening on " + bind);
});

server.listen(PORT);
