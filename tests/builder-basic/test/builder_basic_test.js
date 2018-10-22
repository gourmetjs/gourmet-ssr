"use strict";

const test = require("tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
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

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/foo/bar?a=1&b=2&c`);

  let info = await page.evaluate(() => {
    return {
      server: document.getElementById("server_output").innerText,
      client: document.getElementById("client_output").innerText
    };
  });

  t.equal(info.server, [
    "** SERVER **",
    "page: main",
    `stage: ${app.args.stage}`,
    "staticPrefix: /s/",
    "reqArgs.url: /foo/bar?a=1&b=2&c",
    'clientProps: {"xyz":123}'
  ].join("\n"), "server output");

  t.equal(info.client, [
    "** CLIENT **",
    "Hello, world!\n"
  ].join("\n"), "client output");

  await page.goto(`http://localhost:${port}/admin/?123`);

  info = await page.evaluate(() => {
    return {
      server: document.getElementById("server_output").innerText,
      client: document.getElementById("client_output").innerText
    };
  });

  t.equal(info.server, [
    "** SERVER **",
    "page: admin",
    `stage: ${app.args.stage}`,
    "staticPrefix: /s/",
    "reqArgs.url: /admin/?123",
    'clientProps: {"abc":456}'
  ].join("\n"), "server output");

  t.equal(info.client, "ADMIN: This is admin page...\n", "client output");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
