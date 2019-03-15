"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const got = require("got");
const puppeteer = require("puppeteer");
const run = require("../lib/app");

let app, port;

const expected = {
  mainPage: '{"MainPage_getInitialProps":true,"MainPage_getStockProps":true,"gmctx":"{...}","greeting":"Hello, world!"}',
  indexView: '{"IndexView_getInitialProps":true,"IndexView_getStockProps":true,"MainPage_activeRoute":true,"MainPage_getInitialProps":true,"MainPage_getStockProps":"overridden_by_view","gmctx":"{...}","greeting":"Hello, world!","params":{},"path":"/","route":"{...}","search":""}',
  dashboardView: '{"DashboardView_getInitialProps":true,"MainPage_activeRoute":true,"MainPage_getInitialProps":true,"MainPage_getStockProps":true,"gmctx":"{...}","greeting":"Hello, world!","params":{},"path":"/dashboard","route":"{...}","search":""}'
};

function extract(re, body) {
  const m = re.exec(body);
  if (m && m[1])
    return m[1].replace(/&quot;/g, '"');
  return null;
}

function wrap(title, content) {
  return `JSON(${title})_BEGIN_[${content}]_END_JSON(${title})`;
}

test("start server", t => {
  app = run({port: 0});
  app.server.on("listening", () => {
    port = app.server.address().port;
    t.end();
  });
});

test("check server rendered content", pt(async t => {
  let res = await got(`http://localhost:${port}/`);

  t.equal(
    extract(/JSON\(Page props\)_BEGIN_\[({.*})\]_END_JSON\(Page props\)/, res.body),
    expected.mainPage
  );
  t.equal(
    extract(/JSON\(Route props\)_BEGIN_\[({.*})\]_END_JSON\(Route props\)/, res.body),
    expected.indexView
  );

  res = await got(`http://localhost:${port}/dashboard`);

  t.equal(
    extract(/JSON\(Page props\)_BEGIN_\[({.*})\]_END_JSON\(Page props\)/, res.body),
    expected.mainPage
  );
  t.equal(
    extract(/JSON\(Route props\)_BEGIN_\[({.*})\]_END_JSON\(Route props\)/, res.body),
    expected.dashboardView
  );
}));

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  let title = await page.evaluate(() => {
    return document.title;
  });

  t.equal(title, "IndexView");

  let pageProps = await page.$eval("#page_props", pre => {
    return pre.innerText;
  });

  t.ok(pageProps.indexOf(wrap("Page props", expected.mainPage)) !== -1);

  let routeProps = await page.$eval("#route_props", pre => {
    return pre.innerText;
  });

  t.ok(routeProps.indexOf(wrap("Route props", expected.indexView)) !== -1);

  const requestCount = app.requestCount;

  await page.click('a[href="/dashboard"]');
  await page.waitFor(100);

  title = await page.evaluate(() => {
    return document.title;
  });

  t.equal(title, "DashboardView");

  t.equal(requestCount, app.requestCount, "server request must not be made");

  pageProps = await page.$eval("#page_props", pre => {
    return pre.innerText;
  });

  t.ok(pageProps.indexOf(wrap("Page props", expected.mainPage)) !== -1);

  routeProps = await page.$eval("#route_props", pre => {
    return pre.innerText;
  });

  t.ok(routeProps.indexOf(wrap("Route props", expected.dashboardView)) !== -1);

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
