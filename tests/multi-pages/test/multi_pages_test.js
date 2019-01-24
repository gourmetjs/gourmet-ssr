"use strict";

const test = require("tape");
const pt = require("@gourmet/promise-tape");
const got = require("got");
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

test("check server rendered content", pt(async t => {
  let res = await got(`http://localhost:${port}/`);
  t.ok(res.body.indexOf("<h1>Index</h1><p>Hello, world!</p>") !== -1);
  t.ok(res.body.indexOf("JSON: {&quot;MainPage_getInitialProps&quot;:true,&quot;gmctx&quot;:&quot;{...}&quot;,&quot;greeting&quot;:&quot;Hello, world!&quot;}") !== -1);

  res = await got(`http://localhost:${port}/dashboard`);
  t.ok(res.body.indexOf("<h1>Dashboard</h1>") !== -1);
  t.ok(res.body.indexOf("JSON: {&quot;DashboardPage_getInitialProps&quot;:true,&quot;DashboardPage_makePageProps&quot;:true,&quot;DashboardPage_renderPage&quot;:true,&quot;gmctx&quot;:&quot;{...}&quot;,&quot;username&quot;:&quot;admin&quot;}") !== -1);
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

  t.ok(pre.indexOf('JSON: {"MainPage_getInitialProps":true,"gmctx":"{...}","greeting":"Hello, world!"}') !== -1);

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

  t.ok(pre.indexOf('JSON: {"DashboardPage_getInitialProps":true,"DashboardPage_makePageProps":true,"DashboardPage_renderPage":true,"gmctx":"{...}","username":"admin"}') !== -1);

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
