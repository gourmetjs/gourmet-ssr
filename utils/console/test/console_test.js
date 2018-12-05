"use strict";

const test = require("tape");
const con = require("..")();

function formatter(opts, text) {
  return `*${text}*`;
}

con.reset({
  verbosity: "log",
  capture: "debug",
  colors: true
});

const conBuf = [];

con.toConsole = function(opts, text) {
  conBuf.push([opts, text]);
};

con.addFormatter(formatter);
con.addFormatter(formatter);

test("console output test", t => {
  con.log("Visible:", "Hello, world!");
  con.error("Visible:", con.colors.red("error!"));
  con.warn("Visible:", con.colors.yellow("warning!"));
  con.info("Hidden:", "filtered by verbosity");
  con.debug("Hidden:", "filtered by verbosity");

  t.deepEqual(conBuf, [
    [{level: con.LOG}, "**Visible: Hello, world!**"],
    [{level: con.ERROR}, "**Visible: " + con.colors.red("error!") + "**"],
    [{level: con.WARN}, "**Visible: " + con.colors.yellow("warning!") + "**"]
  ]);

  t.deepEqual(con.buffer, [
    [{level: con.LOG}, "**Visible: Hello, world!**"],
    [{level: con.ERROR}, "**Visible: error!**"],
    [{level: con.WARN}, "**Visible: warning!**"],
    [{level: con.INFO}, "**Hidden: filtered by verbosity**"],
    [{level: con.DEBUG}, "**Hidden: filtered by verbosity**"]
  ]);

  t.end();
});

test("console output test", t => {
  con.reset({
    verbosity: "debug",
    debugFilter: "gourmet:*"
  });

  conBuf.length = 0;

  const d1 = con.getDebug("gourmet:test");
  const d2 = con.getDebug("test");

  d1("Hello, world!");
  d2("Hi, world!");

  con.print("Without props");
  con.print({level: "debug", tag: "gourmet:debug", custom: "prop"}, "With props");
  con.print({level: "debug", tag: "debug"}, "Will be filtered");

  t.deepEqual(conBuf, [
    [{level: con.DEBUG, tag: "gourmet:test"}, "**Hello, world!**"],
    [{level: con.LOG}, "**Without props**"],
    [{level: con.DEBUG, tag: "gourmet:debug", custom: "prop"}, "**With props**"]
  ]);

  t.end();
});
