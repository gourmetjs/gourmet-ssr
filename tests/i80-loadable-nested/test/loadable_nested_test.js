"use strict";

const test = require("tape");
const got = require("got");
const puppeteer = require("puppeteer");
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

test("check server rendered content", pt(async t => {
  let res = await got(`http://localhost:${port}/`);
  t.ok(/<h1>View:.*Home<\/h1>/.test(res.body));

  res = await got(`http://localhost:${port}/messages`);
  t.ok(/<h1>View:.*Messages<\/h1>/.test(res.body));

  res = await got(`http://localhost:${port}/profile`);
  t.ok(/<h1>View:.*Profile<\/h1>/.test(res.body));
  t.ok(/<img.*class="img-thumbnail rounded"\/>/.test(res.body));
  t.ok(/<div class="alert alert-primary">Component A<\/div>/.test(res.body));
  t.ok(/<div class="alert alert-success">Component B<\/div>/.test(res.body));

  res = await got(`http://localhost:${port}/admin`);
  t.ok(/<h1>Admin page<\/h1>/.test(res.body));
}));

test("run puppeteer", pt(async t => {
  async function _verifyLoadables(items) {
    const rendered = await page.evaluate(() => {
      return window.__gourmet_data__.renderedLoadables;
    });
    t.deepEqual(rendered, items, "renderedLoadable should match");
  }

  async function _verifyContent() {
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

    const h1 = await page.$eval("h1", h1 => {
      return h1.innerText;
    });

    t.equal(h1, "View: Profile");

    const a1 = await page.$eval("div.alert.alert-primary", alert => {
      return alert.innerText;
    });

    t.equal(a1, "[M] Component A-- '[M]' should be added when this component is mounted in DOM");

    const a2 = await page.$eval("div.alert.alert-success", alert => {
      return alert.innerText;
    });

    t.equal(a2, "[M] Component B-- '[M]' should be added when this component is mounted in DOM");
  }

  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  await _verifyLoadables(["fnqne3"]);

  await page.click('a[href="/profile"]');

  await _verifyLoadables(["fnqne3"]);  // click should not initiate a page reload

  await page.waitFor(200);

  await _verifyContent();

  await page.goto(`http://localhost:${port}/profile`);

  await _verifyLoadables(["1msvprz","jagne6","1o5yyn5","ji1xsc"]);

  await _verifyContent();

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
