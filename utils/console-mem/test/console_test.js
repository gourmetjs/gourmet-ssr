"use strict";

const test = require("tape");
const getConsole = require("@gourmet/console");
const install = require("..");

const _consoleBuffer = [];

const con = install({
  minLevel: "info",
  useColors: true,
  namespaces: "gourmet:*",
  writeToConsole(opts, text) {
    _consoleBuffer.push([opts, text]);
  }
});

test("console output test", t => {
  const {info, debug} = getConsole("gourmet:test");

  con.log("Visible:", "Hello, world!");
  con.error("Visible:", con.colors.red("error!"));
  con.debug("Hidden:", "filtered by namespaces");

  info("Visible:", "You should see this");
  debug("Hidden:", "You SHOULD NOT see this");

  t.deepEqual(_consoleBuffer, [
    [{level: 3}, "Visible: Hello, world!"],
    [{level: 5}, "Visible: " + con.colors.red("error!")],
    [{level: 2}, "Visible: You should see this"]
  ]);

  t.deepEqual(con.buffer, [
    [{level: 3}, "Visible: Hello, world!"],
    [{level: 5}, "Visible: error!"],
    [{level: 1}, "Hidden: filtered by namespaces"],
    [{level: 2}, "Visible: You should see this"],
    [{level: 1}, "Hidden: You SHOULD NOT see this"]
  ]);

  t.end();
});
