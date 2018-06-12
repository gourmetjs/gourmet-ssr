"use strict";

const npath = require("path");
const test = require("tape");
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

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  t.pass("OK");

  await browser.close();
}));

test("shutdown gourmet server", t => {
  server.close();
  t.end();
});
