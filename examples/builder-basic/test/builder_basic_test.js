"use strict";

const npath = require("path");
const test = require("tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
const pt = require("@gourmet/promise-tape");
const serverArgs = require("@gourmet/server-args");
const ServerImplWatch = require("@gourmet/server-impl-Watch");

class TestServer extends ServerImplWatch {
  installMiddleware() {
    this.app.use("/admin", this.gourmet.renderer({entrypoint: "admin", params: {abc: 456}}));
    this.app.use("/", this.gourmet.renderer({entrypoint: "main", params: {xyz: 123}}));
  }
}

const args = serverArgs([
  "--dir", npath.join(__dirname, ".."),
  "--log-format", "off",
  "--verbose", "off",
  "--port", "0"
].concat(process.argv.slice(2)));

let server, port;

test("start gourmet server", pt(() => {
  server = new TestServer(args);
  server.start();
  return server.ready().then(port_ => {
    port = port_;
  });
}));

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/foo/bar?a=1&b=2&c`);

  let info = await page.evaluate(() => {
    return {
      server: document.getElementById("server_output").innerText,
      client: document.getElementById("client_output").innerText,
    };
  });

  t.equal(info.server, [
    "** SERVER **",
    "entrypoint: main",
    `stage: ${args.stage}`,
    "staticPrefix: /s/",
    "path: /foo/bar",
    'query: {"a":"1","b":"2","c":""}',
    'params: {"xyz":123}'
  ].join("\n"), "server output");

  t.equal(info.client, [
    "** CLIENT **",
    "Hello, world!\n"
  ].join("\n"), "client output");

  await page.goto(`http://localhost:${port}/admin/?123`);

  info = await page.evaluate(() => {
    return {
      server: document.getElementById("server_output").innerText,
      client: document.getElementById("client_output").innerText,
    };
  });

  t.equal(info.server, [
    "** SERVER **",
    "entrypoint: admin",
    `stage: ${args.stage}`,
    "staticPrefix: /s/",
    "path: /",
    'query: {"123":""}',
    'params: {"abc":456}'
  ].join("\n"), "server output");

  t.equal(info.client, "ADMIN: This is admin page...\n", "client output");

  await browser.close();
}));

test("shutdown gourmet server", t => {
  server.close();
  t.end();
});
