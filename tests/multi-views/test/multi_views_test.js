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
  t.ok(/<pre id="page_props">[^]*JSON: {&quot;MainPage_renderPage&quot;:true,&quot;gmctx&quot;:&quot;{...}&quot;,&quot;greeting&quot;:&quot;Hello, world!&quot;}[^]*<\/pre>/.test(res.body));
  t.ok(/<pre id="route_props">[^]*JSON: {&quot;IndexView_getInitialProps&quot;:true,&quot;MainPage_activeRoute&quot;:true,&quot;gmctx&quot;:&quot;{...}&quot;,&quot;greeting&quot;:&quot;Hello, world!&quot;,&quot;params&quot;:{},&quot;path&quot;:&quot;\/&quot;,&quot;route&quot;:&quot;{...}&quot;,&quot;search&quot;:&quot;&quot;}[^]*<\/pre>/.test(res.body));

  res = await got(`http://localhost:${port}/dashboard`);
  t.ok(/<pre id="page_props">[^]*JSON: {&quot;MainPage_renderPage&quot;:true,&quot;gmctx&quot;:&quot;{...}&quot;,&quot;greeting&quot;:&quot;Hello, world!&quot;}[^]*<\/pre>/.test(res.body));
  t.ok(/<pre id="route_props">[^]*JSON: {&quot;DashboardView_getInitialProps&quot;:true,&quot;DashboardView_makeRouteProps&quot;:true,&quot;gmctx&quot;:&quot;{...}&quot;,&quot;greeting&quot;:&quot;Hello, world!&quot;,&quot;params&quot;:{},&quot;path&quot;:&quot;\/dashboard&quot;,&quot;route&quot;:&quot;{...}&quot;,&quot;search&quot;:&quot;&quot;}[^]*<\/pre>/.test(res.body));
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

  const pageProps = await page.$eval("#page_props", pre => {
    return pre.innerText;
  });

  t.ok(pageProps.indexOf('JSON: {"MainPage_renderPage":true,"gmctx":"{...}","greeting":"Hello, world!"}') !== -1);

  let routeProps = await page.$eval("#route_props", pre => {
    return pre.innerText;
  });

  t.ok(routeProps.indexOf('JSON: {"IndexView_getInitialProps":true,"MainPage_activeRoute":true,"gmctx":"{...}","greeting":"Hello, world!","params":{},"path":"/","route":"{...}","search":""}') !== -1);

  const requestCount = app.requestCount;

  await page.click('a[href="/dashboard"]');
  await page.waitFor(100);

  title = await page.evaluate(() => {
    return document.title;
  });

  t.equal(title, "DashboardView");

  t.equal(requestCount, app.requestCount, "server request must not be made");

  routeProps = await page.$eval("#route_props", pre => {
    return pre.innerText;
  });

  t.ok(routeProps.indexOf('JSON: {"DashboardView_getInitialProps":true,"DashboardView_makeRouteProps":true,"gmctx":"{...}","greeting":"Hello, world!","params":{},"path":"/dashboard","route":"{...}","search":""}') !== -1);

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
