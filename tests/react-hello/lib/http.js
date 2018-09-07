"use strict";

const Server = require("@gourmet/server-impl-http");

new Server({
  serverUrl: "http://localhost:3939"
}).start();
