"use strict";

const npath = require("path");
const test = require("tape");
const got = require("got");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
const pt = require("@gourmet/promise-tape");
const serverArgs = require("@gourmet/server-args");
const Server = require("@gourmet/server-impl-watch");

const args = serverArgs([
  "--dir", npath.join(__dirname, ".."),
  "--log-format", "off",
  "--verbose", "off",
  "--port", "0"
].concat(process.argv.slice(2)));

let server, port;

test("start gourmet server", pt(() => {
  server = new Server(args);
  server.start();
  return server.ready().then(port_ => {
    port = port_;
  });
}));

test("check server rendered content", pt(async t => {
  let res = await got(`http://localhost:${port}/`);
  t.ok(res.body.indexOf("<h1>Panel: Home</h1>") !== -1);

  res = await got(`http://localhost:${port}/messages`);
  t.ok(res.body.indexOf("<h1>Panel: Messages</h1>") !== -1);

  res = await got(`http://localhost:${port}/profile`);
  t.ok(res.body.indexOf("<h1>Panel: Profile</h1>") !== -1);
  t.ok(/<img.*class="img-thumbnail rounded"\/>/.test(res.body));
  t.ok(/<div class="alert alert-primary">Component A<\/div>/.test(res.body));
  t.ok(/<div class="alert alert-success">Component B<\/div>/.test(res.body));
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

    t.equal(h1, "Panel: Profile");

    const a1 = await page.$eval("div.alert.alert-primary", alert => {
      return alert.innerText;
    });

    t.equal(a1, "[M] Component A-- '[M]' should be added when this component is mounted in DOM");

    const a2 = await page.$eval("div.alert.alert-success", alert => {
      return alert.innerText;
    });

    t.equal(a2, "[M] Component B-- '[M]' should be added when this component is mounted in DOM");
  }

  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  await _verifyLoadables(["1njppir"]);

  await page.click('a[href="/profile"]');

  await _verifyLoadables(["1njppir"]);  // click should not initiate a page reload

  await page.waitFor(200);

  await _verifyContent();

  await page.goto(`http://localhost:${port}/profile`);

  await _verifyLoadables(["ba6y1q", "ndm2lm", "15ln4ga", "1kusjpm"]);

  await _verifyContent();

  await browser.close();
}));

test("shutdown gourmet server", t => {
  server.close();
  t.end();
});
