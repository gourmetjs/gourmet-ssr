"use strict";

const test = require("tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
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

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}`);

  const info = await page.evaluate(() => {
    return {
      server: document.getElementById("server_output").innerText,
      client: document.getElementById("client_output").innerText
    };
  });

  t.deepEqual(JSON.parse(info.server), {
    "console": "native",
    "global": "native",
    "process": "native",
    "__filename": "/index.js",
    "__dirname": "/",
    "Buffer": "native",
    "setImmediate": "native",
    "path": "object (external)",
    "url": "object (external)",
    "fs": "object (external)",
    "domready": "empty (bundle)",
    "rimraf": "function (bundle)",
    "classnames": "function (external)",
    "mkdirp": "function (external)",
    "none": "empty (bundle)",
    "./data.json": "object (bundle)"
  }, "server output");

  t.deepEqual(JSON.parse(info.client), {
    "console": "native",
    "global": "native",
    "process": "polyfill",
    "__filename": "/index.js",
    "__dirname": "/",
    "Buffer": "polyfill",
    "setImmediate": "native",
    "path": "object (bundle)",
    "url": "object (bundle)",
    "fs": "error",
    "domready": "function (bundle)",
    "rimraf": "empty (bundle)",
    "classnames": "function (bundle)",
    "mkdirp": "empty (bundle)",
    "none": "empty (bundle)",
    "./data.json": "object (bundle)"
  }, "client output");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
