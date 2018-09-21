"use strict";

const test = require("tape");
const got = require("got");
const pt = require("@gourmet/promise-tape");
const run = require("../lib/app");

let app, port;

test("start server", t => {
  app = run({
    workDir: __dirname + "/..",
    port: 0,
    debug: false
  });
  app.server.on("listening", () => {
    port = app.server.address().port;
    t.end();
  });
});

test("check server rendered content", pt(async t => {
  let res = await got(`http://localhost:${port}/`);
  t.ok(/<link rel="stylesheet"[^<]+hello\.css/.test(res.body));

  res = await got(`http://localhost:${port}/admin`);
  t.notOk(/<link rel="stylesheet"[^<]+hello\.css/.test(res.body));
}));

test("close server", t => {
  app.server.close();
  t.end();
});
