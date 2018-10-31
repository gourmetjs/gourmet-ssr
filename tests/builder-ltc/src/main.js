"use strict";

module.exports = () => {
  return import("../../../.test/builder-ltc/message.js").then(mod => {
    return [
      "<pre>",
      mod.default,
      "</pre>"
    ].join("\n");
  }).catch(err => {
    return [
      "<pre>",
      err.message,
      "</pre>"
    ].join("\n");
  });
};
