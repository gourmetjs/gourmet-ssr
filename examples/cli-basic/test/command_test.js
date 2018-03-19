"use strict";

const test = require("tape");
const shell = require("pshell");

test("Running 'gourmet say'", t => {
  shell("gourmet say", {echoCommand: false, captureOutput: true}).then(res => {
    t.equal(res.stdout, [
      "Hello, world!",
      "Greetings!",
      "command: say",
      "argv: {}",
      ""
    ].join("\n"));
  }).then(() => t.end(), t.end);
});

test("Running 'gourmet say -d'", t => {
  shell("gourmet say -d", {echoCommand: false, captureOutput: true}).then(res => {
    t.equal(res.stdout, [
      "** Hello, world! **",
      "** Greetings! **",
      "command: say",
      "argv: {\"d\":true,\"decorate\":true}",
      ""
    ].join("\n"));
  }).then(() => t.end(), t.end);
});
