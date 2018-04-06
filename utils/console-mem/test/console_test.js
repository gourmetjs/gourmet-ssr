"use strict";

const test = require("tape");
const getConsole = require("@gourmet/console");
const ConsoleFactory = require("@gourmet/console/lib/ConsoleFactory");
const installFactory = require("..");

const _consoleBuffer = [];

installFactory({
  console: new ConsoleFactory({
    minLevel: "info",
    useColors: true,
    flush(info, text) {
      _consoleBuffer.push([info, text]);
    }
  })
});

test("console output test", t => {
  const con = getConsole();
  const {info, debug} = getConsole("gourmet:test");

  con.log("Visible:", "Hello, world!");
  con.error("Visible:", con.colors.red("error!"));

  info("Visible:", "You should see this");
  debug("Hidden:", "You SHOULD NOT see this");

  t.deepEqual(_consoleBuffer, [
    [{level: 3}, "Visible: Hello, world!"],
    [{level: 5}, "Visible: " + con.colors.red("error!")],
    [{level: 2, name: "gourmet:test"}, "Visible: You should see this"]
  ]);

  t.deepEqual(con.buffer, [
    [{level: 3}, "Visible: Hello, world!"],
    [{level: 5}, "Visible: error!"],
    [{level: 2, name: "gourmet:test"}, "Visible: You should see this"],
    [{level: 1, name: "gourmet:test"}, "Hidden: You SHOULD NOT see this"]
  ]);

  t.end();
});
