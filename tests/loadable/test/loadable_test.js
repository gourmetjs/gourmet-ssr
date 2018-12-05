"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const puppeteer = require("puppeteer");
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
  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  let panelText = await page.$eval(".current-panel", div => {
    return div.innerText;
  });

  t.equal(panelText, "This is the content of Panel A");

  await page.click("input#sel_b");
  await page.waitFor(100);

  panelText = await page.$eval(".current-panel", div => {
    return div.innerText;
  });

  t.equal(panelText, "This is the content of Panel B");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
