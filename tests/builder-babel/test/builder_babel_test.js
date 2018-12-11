"use strict";

const test = require("tape");
const puppeteer = require("puppeteer");
const pt = require("@gourmet/promise-tape");
const run = require("../lib/app");

let app, port;

test("start server", t => {
  app = run({port: 0});
  app.server.on("listening", () => {
    port = app.server.address().port;
    t.end();
  });
});

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}`);

  const info = await page.evaluate(() => {
    return {
      server: document.getElementById("server_output").innerText,
      client: document.getElementById("client_output").innerText
    };
  });

  t.deepEqual(JSON.parse(info.server), {
    "message": "Hey, world!",
    "class A": "class A {}",
    "fn": "function fn() {\n  var val = 10;\n  return val;\n}"
  }, "server output");

  t.deepEqual(JSON.parse(info.client), {
    "message": "Hi, world!",
    "class A": "function A() {}",
    "fn": "function fn() {\n  var val = 10;\n  return val;\n}"
  }, "client output");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
