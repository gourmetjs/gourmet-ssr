"use strict";

const npath = require("path");
const test = require("tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
const pt = require("@gourmet/promise-tape");
const serverArgs = require("@gourmet/server-args");
const TestServer = require("..");

const args = serverArgs.parse({
  dir: npath.join(__dirname, ".."),
  logFormat: "off",
  port: 0
});

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

  const {server, client} = await page.evaluate(() => {
    return {
      server: document.getElementById("server_output").innerText,
      client: document.getElementById("client_output").innerText,
    };
  });

  t.equal(server, [
    "** SERVER **",
    "entrypoint: main",
    "stage: local",
    "staticPrefix: /s/",
    "path: /foo/bar",
    'query: {"a":"1","b":"2","c":""}',
    'params: {"xyz":123}'
  ].join("\n"), "server output");

  t.equal(client, [
    "** CLIENT **",
    "Hello, world!\n"
  ].join("\n"), "client output");

  await page.goto(`http://localhost:${port}/?123`);

  await browser.close();
}));

test("shutdown gourmet server", t => {
  server.close();
  t.end();
});
