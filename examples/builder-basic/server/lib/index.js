"use strict";

const serverArgs = require("@gourmet/server-args");
const TestServer = require("./TestServer");

new TestServer(serverArgs(process.argv.slice(2))).start();
