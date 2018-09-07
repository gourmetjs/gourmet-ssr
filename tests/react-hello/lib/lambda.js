"use strict";

const serverArgs = require("@gourmet/server-args");
const Server = require("@gourmet/server-impl-lambda");

const args = serverArgs(process.argv.slice(2));

new Server({
  functionName: `react-hello-ui-${args.stage}-render`,
  enableStatic: true
}, args).start();
