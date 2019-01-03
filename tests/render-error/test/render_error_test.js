"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const got = require("got");
const puppeteer = require("puppeteer");
const run = require("../lib/app");

let app, port;

test("start server", t => {
  app = run({port: 0, debug: false});
  app.server.on("listening", () => {
    port = app.server.address().port;
    t.end();
  });
});

test("check server rendered content", pt(async t => {
  try {
    const res = await got(`http://localhost:${port}/server-error`, {retries: 0});
    // From v16.7.0, React closes the socket gracefully on a server exception instead of destroying it
    // abruptly as in previous versions. This results in a partial, broken HTML marked as a successful
    // HTTP 200 transction.
    // Maybe we should report this problem as a follow-up of https://github.com/facebook/react/issues/14331.
    //
    // t.fail("Should not be here");
  } catch (err) {
    t.equal(err.code, "ECONNRESET");
  }

  try {
    await got(`http://localhost:${port}/init-error`, {retries: 0, json: true});
    t.fail("Should not be here");
  } catch (err) {
    t.equal(err.statusCode, 500);
    t.deepEqual(err.response.body, {
      error: {
        name: "Error",
        message: "init server error",
        statusCode: 500,
        detail: null
      }
    });
  }
}));

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}`);

  const pre = await page.$eval("pre#render_error", pre => {
    return pre.innerText;
  });

  t.equal(pre, "Error: render client error");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
