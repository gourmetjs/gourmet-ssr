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

  let todos = await page.$eval("#todos", pre => {
    return pre.innerText;
  });

  t.equal(todos, [
    "Buy a pack of milk",
    "Finish the documentation"
  ].join("\n"));

  await page.type("#add_todo", "Publish to GitHub");
  await page.click("#add_button");
  await page.waitFor(100);
  
  todos = await page.$eval("#todos", pre => {
    return pre.innerText;
  });

  t.equal(todos, [
    "Buy a pack of milk",
    "Finish the documentation",
    "Publish to GitHub"
  ].join("\n"));

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
