"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const got = require("got");
const puppeteer = require("puppeteer");
const run = require("../lib/app");

let app, port;

const expected = {
  mainPage: '{"MainPage_getInitialProps":true,"MainPage_getStockProps":true,"gmctx":"{...}","greeting":"Hello, world!"}',
  dashboardPage: '{"DashboardPage_createPageElement":true,"DashboardPage_getInitialProps":true,"DashboardPage_makePageProps":true,"gmctx":"{...}","username":"admin"}'
};

function extract(re, body) {
  const m = re.exec(body);
  if (m && m[1])
    return m[1].replace(/&quot;/g, '"');
  return null;
}

function wrap(content) {
  return `JSON_BEGIN_[${content}]_END_JSON`;
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

  t.ok(res.body.indexOf("<h1>Index</h1><p>Hello, world!</p>") !== -1);
  t.equal(
    extract(/JSON_BEGIN_\[({.*})\]_END_JSON/, res.body),
    expected.mainPage
  );

  res = await got(`http://localhost:${port}/dashboard`);
  t.ok(res.body.indexOf("<h1>Dashboard</h1>") !== -1);
  t.equal(
    extract(/JSON_BEGIN_\[({.*})\]_END_JSON/, res.body),
    expected.dashboardPage
  );
}));

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  let h1 = await page.$eval("h1", h1 => {
    return h1.innerText;
  });

  t.equal(h1, "Index");

  let pre = await page.$eval("pre", pre => {
    return pre.innerText;
  });

  t.ok(pre.indexOf(wrap(expected.mainPage)) !== -1);

  let config = await page.evaluate(() => {
    return {allPages: window.__allPages, onlyMainPage: window.__onlyMainPage};
  });

  t.deepEqual(config, {allPages: true, onlyMainPage: true});

  await page.goto(`http://localhost:${port}/dashboard`);

  h1 = await page.$eval("h1", h1 => {
    return h1.innerText;
  });

  t.equal(h1, "Dashboard");

  pre = await page.$eval("pre", pre => {
    return pre.innerText;
  });

  t.ok(pre.indexOf(wrap(expected.dashboardPage)) !== -1);

  config = await page.evaluate(() => {
    return {allPages: window.__allPages, onlyMainPage: window.__onlyMainPage};
  });

  t.deepEqual(config, {allPages: true});

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
