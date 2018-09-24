"use strict";

const ModuleA = require("@gourmet/test-builder-src-module-a");
const ModuleB = require("@gourmet/test-builder-src-module-b");

module.exports = () => {
  return [
    "<pre>",
    `  a: ${ModuleA.name}`,
    `  b: ${ModuleB.name}`,
    "</pre>"
  ].join("\n");
};
