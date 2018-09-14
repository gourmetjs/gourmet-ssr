"use strict";

const npath = require("path");
const fs = require("fs");
const merge = require("@gourmet/merge");
const escapeScript = require("@gourmet/escape-script");

module.exports = function embedClient(gourmet, options) {
  const opts = escapeScript(JSON.stringify({
    serverUrl: `ws://${options.host}:${options.port}`,
    reconnect: options.watchReconnect
  }));
  const client = escapeScript(fs.readFileSync(npath.join(__dirname, "client.js.txt"), "utf8"));

  gourmet.baseOptions = merge(gourmet.baseOptions, {
    context: {
      html: {
        headBottom: [
          `<script>window.__GOURMET_WATCH_OPTIONS__=${opts}</script>`,
          `<script>${client}</script>`
        ]
      }
    }
  });
};
