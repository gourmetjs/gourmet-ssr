"use strict";

const npath = require("path");
const fs = require("fs");
const merge = require("@gourmet/merge");
const omit = require("@gourmet/omit");
const escapeScript = require("@gourmet/escape-script");

// Note about browser WebSocket behavior:
// It appears that "close" comes even without "open" for the initial failure.
// This behavior is observed in Chrome, Edge & Firefox.
module.exports = function embedClient(gourmet, options) {
  const client = fs.readFileSync(npath.join(__dirname, "client.js.txt"), "utf8");
  const opts = Object.assign({
    serverUrl: `ws://${options.host}:${options.port}`
  }, omit(options, ["port", "host"]));
  const content = client.replace("__GOURMET_WATCH_OPTIONS__", JSON.stringify(opts));

  gourmet.baseOptions = merge(gourmet.baseOptions, {
    context: {
      html: {
        headBottom: [
          `<script>${escapeScript(content)}</script>`
        ]
      }
    }
  });
};
