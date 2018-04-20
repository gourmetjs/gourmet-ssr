"use strict";

const http = require("http");
const https = require("https");

module.exports = function httpModule(protocol, defVal) {
  if (typeof protocol === "string")
    return /^https|wss/.test(protocol) ? https : http;
  return /^https|wss/.test(defVal) ? https : http;
};
