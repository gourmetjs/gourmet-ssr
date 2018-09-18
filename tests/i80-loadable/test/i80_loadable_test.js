"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
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

  await page.goto(`http://localhost:${port}/`);

  let h1 = await page.$eval("h1", h1 => {
    return h1.innerText;
  });

  t.equal(h1, "View: Home");

  const historyIndex = app.history.length;

  await page.click('a[href="/profile"]');
  await page.waitFor(100);

  h1 = await page.$eval("h1", h1 => {
    return h1.innerText;
  });

  t.equal(h1, "View: Profile");

  const newRequests = app.history.slice(historyIndex);

  t.deepEqual(newRequests, [
    "/s/profile.bundle.js"
  ],  "`profile.bundle.js` must be loaded dynamically");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
