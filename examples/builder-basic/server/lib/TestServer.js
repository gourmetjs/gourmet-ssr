"use strict";

const LocalServer = require("@gourmet/example-local-server");

class TestServer extends LocalServer {
  installMiddleware() {
    this.app.use("/admin", this.gourmet.renderer({entrypoint: "admin", params: {abc: 456}}));
    this.app.use("/", this.gourmet.renderer({entrypoint: "main", params: {xyz: 123}}));
  }
}

module.exports = TestServer;
