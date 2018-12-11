"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const puppeteer = require("puppeteer");
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

  await page.goto(`http://localhost:${port}/`);
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/login`, "redirection to /login");

  await page.click("a#login");
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/?logged-in`, "main page");

  await page.click("a#james");
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/item/james?logged-in`, "Item: james");

  await page.click("a#main");
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/?logged-in`, "back to main");

  await page.click("a#jane");
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/item/jane?logged-in`, "Item: jane");

  await page.click("a#logout");
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/logout`, "logout");

  await page.click("a#login_again");
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/?logged-in`, "main page");

  await page.click("a#date");
  await page.waitFor(100);
  t.equal(await page.url(), `http://localhost:${port}/2018/12/11?logged-in`, "date page");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
