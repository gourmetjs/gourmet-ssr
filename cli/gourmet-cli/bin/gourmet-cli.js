#!/usr/bin/env node
"use strict";

const GourmetCli = require("@gourmet/gourmet-cli-impl");
const cli = new GourmetCli();
cli.main(cli.parseArgs(process.argv.slice(2)));
