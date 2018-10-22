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

  await page.goto(`http://localhost:${port}/`);

  const img = await page.$eval("img", img => {
    return {
      complete: img.complete,
      naturalWidth: img.naturalWidth
    };
  });

  t.ok(
    img.complete && (img.naturalWidth !== undefined && img.naturalWidth !== 0),
    "image should be loaded successfully"
  );

  const navBgColor = await page.$eval("nav.navbar", nav => {
    return window.getComputedStyle(nav).getPropertyValue("background-color");
  });

  t.equal(
    navBgColor,
    "rgb(52, 58, 64)",
    "css should be loaded"
  );

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
