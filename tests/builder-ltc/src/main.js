"use strict";

module.exports = () => {
  return import("../../../.gourmet/builder-ltc/src/message.js").then(mod => {
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
