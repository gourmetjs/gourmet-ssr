"use strict";

const fs = require("fs");
const test = require("tape");
const got = require("got");
const pt = require("@gourmet/promise-tape");
const run = require("../lib/app");

let app, port;

test("start server", t => {
  app = run({
    port: 0,
    debug: false
  });
  app.server.on("listening", () => {
    port = app.server.address().port;
    t.end();
  });
});

test("check server rendered content", pt(async t => {
  const args = app.args;
  let filename;

  if (args.stage === "ltc") { 
    const manifest = JSON.parse(fs.readFileSync(`${args.serverDir}/manifest.json`, "utf8"));
    const files = manifest.client.files;
    Object.keys(files).forEach(name => {
      const info = files[name];
      if (name.endsWith(".css") && info.path === "./src/hello.css" && info.type === "global_css") {
        filename = name.substring(0, name.length - 4) + "\\.css";
      }
    });
    t.ok(/^[a-zA-Z0-9]{10}\\\.css$/.test(filename), "filename must be 10 chars base62 encoded string");
  } else {
    filename = args.stage === "prod" ? "c3Z6rog8\\.css" : "hello\\.css";
  }

  let res = await got(`http://localhost:${port}/`);
  t.ok((new RegExp(`<link rel="stylesheet"[^<]+${filename}`)).test(res.body));

  res = await got(`http://localhost:${port}/admin`);
  t.notOk((new RegExp(`<link rel="stylesheet"[^<]+${filename}`)).test(res.body));
}));

test("close server", t => {
  app.server.close();
  t.end();
});
