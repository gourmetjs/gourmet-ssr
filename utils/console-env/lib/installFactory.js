"use strict";

const getConsole = require("@gourmet/console");
const ConsoleFactory = require("@gourmet/console/lib/ConsoleFactory");
const detectOptions = require("./detectOptions");

module.exports = function installFactory(options) {
  getConsole.defaultFactory = new ConsoleFactory(detectOptions(options));
};
