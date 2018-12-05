"use strict";

const fs = require("fs");
const test = require("tape");
const puppeteer = require("puppeteer");
const pt = require("@gourmet/promise-tape");
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

test("check `manifest.client.files` output", t => {
  function _find(item) {
    return items.find(elem => {
      return item.type === elem.type && item.name === elem.name;
    });
  }

  const args = app.args;
  const manifest = JSON.parse(fs.readFileSync(`${args.serverDir}/manifest.json`, "utf8"));
  const files = manifest.client.files;
  const modules = manifest.client.modules;
  const items = [];

  Object.keys(files).forEach(filename => {
    const info = files[filename];

    if (!info.modules)
      return;

    let item;

    info.modules.forEach(id => {
      const path = modules[id];
      const m = /\/node_modules\/(@[\w-]+\/[\w-]+|[\w-]+)\//.exec(path);

      if (m) {
        const name = m[1];
        if (name === "react" || name === "react-dom") {
          if (item) {
            if (item.type !== "custom" || item.name !== "react")
              return t.fail(`${path} is mixed with invalid files in ${filename}`);
          } else {
            item = {
              type: "custom",
              name: "react"
            };
          }
        } else  {
          if (item) {
            if (item.type !== "vendor" || item.name !== name)
              return t.fail(`${path} is mixed with invalid files in ${filename}`);
          } else {
            item = {
              type: "vendor",
              name
            };
          }
        }
      } else if (path.startsWith("./src/components/") || path.startsWith("./src/containers/")) {
        const name = path.startsWith("./src/components/") ? "components" : "containers";
        if (item) {
          if (item.type !== "custom" || item.name !== name)
            return t.fail(`${path} is mixed with invalid files in ${filename}`);
        } else {
          item = {
            type: "custom",
            name
          };
        }
      } else {
        if (item) {
          if (item.type !== "local")
            return t.fail(`${path} is mixed with invalid files in ${filename}`);
        } else {
          item = {
            type: "local"
          };
        }
      }
    });

    if (item) {
      if (item.type !== "local" && _find(item))
        return t.fail(`${item.type} ${item.name} is duplicated`);
      items.push(item);
    }
  });

  t.ok(_find({type: "custom", name: "react"}), "custom react must exist");
  t.ok(_find({type: "custom", name: "components"}), "custom components must exist");
  t.ok(_find({type: "custom", name: "containers"}), "custom containers must exist");
  t.ok(_find({type: "vendor", name: "bootstrap"}), "vendor bootstrap must exist");
  t.ok(_find({type: "vendor", name: "classnames"}), "vendor classnames must exist");
  t.ok(_find({type: "vendor", name: "domready"}), "vendor domready must exist");
  t.ok(_find({type: "vendor", name: "emotion"}), "vendor emotion must exist");
  t.ok(_find({type: "vendor", name: "prop-types"}), "vendor prop-types must exist");
  t.ok(_find({type: "vendor", name: "react-emotion"}), "vendor react-emotion must exist");
  t.ok(_find({type: "vendor", name: "reactstrap"}), "vendor reactstrap must exist");
  t.ok(_find({type: "vendor", name: "tinycolor2"}), "vendor tinycolor2 must exist");

  t.end();
});

test("run puppeteer", pt(async t => {
  const browser = await puppeteer.launch({
    headless: process.env.TEST_HEADLESS === "0" ? false : true,
    slowMo: parseInt(process.env.TEST_SLOWMO || 0, 10)
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/`);

  const img = await page.$eval("img", img => {
    return {
      complete: img.complete,
      naturalWidth: img.naturalWidth
    };
  });

  t.ok(
    img.complete && (img.naturalWidth !== undefined && img.naturalWidth !== 0),
    "image should be loaded successfully"
  );

  const navBgColor = await page.$eval("nav.navbar", nav => {
    return window.getComputedStyle(nav).getPropertyValue("background-color");
  });

  t.equal(
    navBgColor,
    "rgb(52, 58, 64)",
    "css should be loaded"
  );

  await browser.close();
}));

test("close server", t => {
  app.server.close();
  t.end();
});
