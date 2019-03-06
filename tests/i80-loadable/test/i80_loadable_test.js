"use strict";

const fs = require("fs");
const test = require("tape");
const got = require("got");
const pt = require("@gourmet/promise-tape");
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
  let re;

  if (app.args.stage === "local") {
    re = {
      home: /<script.*src="\/s\/home\.js"><\/script>/,
      messages: /<script.*src="\/s\/messages\.js"><\/script>/,
      profile: /<script.*src="\/s\/profile\.js"><\/script>/
    };
  } else if (app.args.stage === "prod") {
    re = {
      home: /<script.*src="\/s\/x86vUOIc\.js"><\/script>/,
      messages: /<script.*src="\/s\/3pSccKy5\.js"><\/script>/,
      profile: /<script.*src="\/s\/dj7zHVlC\.js"><\/script>/
    };
  } else {
    return;
  }

  let res = await got(`http://localhost:${port}/`);
  t.ok(re.home.test(res.body), "home");

  res = await got(`http://localhost:${port}/messages`);
  t.ok(re.messages.test(res.body), "message");

  res = await got(`http://localhost:${port}/profile`);
  t.ok(re.profile.test(res.body), "profile");
}));


test("run puppeteer", pt(async t => {
  const args = app.args;
  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
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
