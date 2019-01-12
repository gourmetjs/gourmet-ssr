"use strict";

module.exports = function prefixLines(prefix, text) {
  return text.split("\n").map(line => prefix + line).join("\n");
};
