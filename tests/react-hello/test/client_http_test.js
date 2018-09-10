"use strict";

const test = require("tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
const pt = require("@gourmet/promise-tape");
const gourmet = require("@gourmet/client-http");
const GourmetHttpServer = require("@gourmet/http-server");
const getConsole = require("@gourmet/console");
const run = require("../lib/app");

let gourmetServer, gourmetPort;
let app, port;

test("start back server", pt(() => {
  gourmetServer = new GourmetHttpServer({
    workDir: __dirname + "/..",
    serverDir: ".gourmet/local/server",
    clientDir: ".gourmet/local/client",
    port: 0,
    console: getConsole({minLevel: "error", name: "gourmet:net"})
  });
  gourmetServer.start();
  return gourmetServer.ready().then(port => {
    gourmetPort = port;
  });
}));

test("start front server", t => {
  app = run({
    serverUrl: `http://localhost:${gourmetPort}`,
    logFormat: "off",
    port: 0,
    debug: false
  }, gourmet);
  app.server.on("listening", () => {
    port = app.server.address().port;
    t.end();
  });
});

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  const curTime = await page.$eval("span.time-value", span => {
    return span.innerText;
  });

  t.notEqual(curTime, "-");

  const initData = await page.evaluate(() => {
    return window.__INIT_DATA__;
  });

  t.ok(typeof initData === "object");

  await browser.close();
}));

test("shutdown servers", t => {
  app.server.close();
  gourmetServer.close();
  t.end();
});
