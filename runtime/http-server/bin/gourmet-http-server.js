#!/usr/bin/env node
"use strict";

const serverArgs = require("@gourmet/server-args");
const GourmetServerLauncher = require("../lib/GourmetServerLauncher");

const args = serverArgs(process.argv.slice(2));

const launcher = new GourmetServerLauncher(args);
launcher.run();
