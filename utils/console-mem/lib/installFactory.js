"use strict";

const getConsole = require("@gourmet/console");
const MemConsoleFactory = require("./MemConsoleFactory");

module.exports = function installFactory(options) {
  getConsole.defaultFactory = new MemConsoleFactory(options);
};
