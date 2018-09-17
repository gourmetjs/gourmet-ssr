#!/usr/bin/env node
"use strict";

const serverArgs = require("@gourmet/server-args");
const GourmetServerLauncher = require("../lib/GourmetServerLauncher");

const helpMessage = [
  "gourmet-http-server [options]",
  "",
  "  --help, -h          Show this help screen",
  "  --count <n>         Number of worker processes to fork (default: number of CPU cores)",
  "  --stage, -s <s>     Set the stage (default: 'local')",
  "  --work-dir,         Set the working directory (default: CWD)",
  "    --dir, -d <d>",
  "  --server-dir <d>    Set the server directory (default: `{work-dir}/.gourmet/{stage}/server)`",
  "  --client-dir <d>    Set the client directory (default: `{work-dir}/.gourmet/{stage}/client)`",
  "  --port <n>          Set the listening port (default: '3939')",
  "  --host <h>          Set the listening host (default: '0.0.0.0')",
  "  --no-static         Do not serve static assets (defaut: --static)",
  "  --static-prefix <s> Set the path prefix of static assets served by this server (default: '/s/')",
  "  --page <s>          Set the default page (default: 'main')",
  "  --siloed            Set the default 'siloed' option (default: '--no-siloed')",
  "  --context.x.y       Set the arbitrary rendering context value (result: '{x: {y: true}}')",
  "  --colors            Use ANSI colors in console output (default: auto detect)",
  "  --verbose, -v <n>   Set the verbosity level (debug|info|log*|warn|error|0-5)",
  "  --log-format <s>    Set the Morgan log format (dev*|combined|common|short|tiny|off)",
  "  --no-debug          Do not show details in error response (default: '--debug')"
].join("\n");

const launcher = new GourmetServerLauncher(serverArgs({
  port: 3939,   // We need to change the default port number of `serverArgs()`
  helpMessage
}));

launcher.run();
