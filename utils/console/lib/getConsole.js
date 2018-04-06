"use strict";

const ConsoleFactory = require("./ConsoleFactory");

function getConsole(info, factory) {
  if (factory === undefined)
    factory = getConsole.defaultFactory;

  return factory.get(info);
}

getConsole.defaultFactory = new ConsoleFactory();

module.exports = getConsole;
