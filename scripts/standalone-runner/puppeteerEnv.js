"use strict";

const npath = require("path");
const fs = require("fs");

const chromiumDir = npath.join(__dirname, "../../node_modules/puppeteer/.local-chromium");
const items = fs.readdirSync(chromiumDir);

if (items.length !== 1)
  throw Error("Check the local version of Chromium:", chromiumDir);

const platform = items[0];
let execPath;

if (platform.startsWith("win64-")) {
  execPath = npath.join(chromiumDir, platform, "chrome-win/chrome.exe");
} else if (platform.startsWith("mac-")) {
  execPath = npath.join(chromiumDir, platform, "chrome-mac/Chromium.app/Contents/MacOS/Chromium");
} else {
  throw Error("Uknown platform:", platform);
}

module.exports = {
  PUPPETEER_EXECUTABLE_PATH: execPath,
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"
};
