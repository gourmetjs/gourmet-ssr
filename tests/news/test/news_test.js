"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
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

  await page.goto(`http://localhost:${port}/`);

  const divs = await page.$$("div.media-body");

  t.ok(divs.length > 0, "There must be news items");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
