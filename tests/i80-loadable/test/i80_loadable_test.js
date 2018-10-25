"use strict";

const fs = require("fs");
const test = require("tape");
const pt = require("@gourmet/promise-tape");
const puppeteer = require("puppeteer");
const testArgs = require("@gourmet/puppeteer-args");
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

test("run puppeteer", pt(async t => {
  const args = app.args;
  const browser = await puppeteer.launch(testArgs);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  let h1 = await page.$eval("h1", h1 => {
    return h1.innerText;
  });

  t.equal(h1, "View: Home");

  const historyIndex = app.history.length;

  await page.click('a[href="/profile"]');
  await page.waitFor(100);

  h1 = await page.$eval("h1", h1 => {
    return h1.innerText;
  });

  t.equal(h1, "View: Profile");

  const newRequests = app.history.slice(historyIndex);
  let filename;

  if (args.stage === "ltc") { 
    const stats = JSON.parse(fs.readFileSync(`${args.outputDir}/${args.stage}/info/stats.client.json`, "utf8"));
    Object.keys(stats.assetsByChunkName).forEach(name => {
      if (name === "profile")
        filename = stats.assetsByChunkName[name];
    });
    t.ok(/^[a-zA-Z0-9]{10}\.js$/.test(filename), "filename must be 10 chars base62 encoded string");
  } else {
    filename = args.stage === "prod" ? "dj7zHVlC.js" : "profile.js";
  }

  t.deepEqual(newRequests, [`/s/${filename}`], "'profile' must be loaded dynamically");

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
