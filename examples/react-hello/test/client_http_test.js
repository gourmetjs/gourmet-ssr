"use strict";

const npath = require("path");
const test = require("tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
const pt = require("@gourmet/promise-tape");
const serverArgs = require("@gourmet/server-args");
const BackServer = require("@gourmet/http-server/lib/GourmetHttpServer");
const FrontServer = require("@gourmet/server-impl-http");

const back = {
  server: null,
  port: null,
  args: serverArgs([
    "--dir", npath.join(__dirname, ".."),
    "--log-format", "off",
    "--verbose", "off",
    "--port", "0"
  ].concat(process.argv.slice(2)))
};

const front = {
  server: null,
  port: null,
  args: serverArgs([
    "--log-format", "off",
    "--verbose", "off",
    "--port", "0"
  ].concat(process.argv.slice(2)))
};

test("start back server", pt(() => {
  back.server = new BackServer(null, back.args);
  back.server.start();
  return back.server.ready().then(port => {
    back.port = port;
  });
}));

test("start front server", pt(() => {
  front.server = new FrontServer({serverUrl: `http://localhost:${back.port}`}, front.args);
  front.server.start();
  return front.server.ready().then(port => {
    front.port = port;
  });
}));

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${front.port}/`);

  const curTime = await page.$eval("span.time-value", span => {
    return span.innerText;
  });

  t.notEqual(curTime, "-");

  await browser.close();
}));

test("shutdown servers", t => {
  front.server.close();
  back.server.close();
  t.end();
});
