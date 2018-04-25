"use strict";

const serverArgs = require("@gourmet/server-args");
const LocalServer = require("@gourmet/example-local-server");

new LocalServer(serverArgs(process.argv.slice(2))).start();
