"use strict";

const test = require("tape");
const shell = require("pshell");

test("Running 'gourmet say'", t => {
  shell("gourmet say", {echoCommand: false, captureOutput: true}).then(res => {
    t.equal(res.stdout, [
      "Hello, world!",
      "Greetings!",
      "command: say",
      'argv: {"_":["say"]}',
      ""
    ].join("\n"));
  }).then(() => t.end(), t.end);
});

test("Running 'gourmet say -e'", t => {
  shell("gourmet say -e", {echoCommand: false, captureOutput: true}).then(res => {
    t.equal(res.stdout, [
      "** Hello, world! **",
      "** Greetings! **",
      "command: say",
      'argv: {"_":["say"],"e":true}',
      ""
    ].join("\n"));
  }).then(() => t.end(), t.end);
});
