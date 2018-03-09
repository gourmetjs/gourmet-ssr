#!/usr/bin/env node
"use strict";

const GourmetCli = require("../lib/GourmetCli");
const cli = new GourmetCli();
cli.runCommand(process.argv.slice(2));
