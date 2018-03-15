"use strict";

module.exports = userCtx => {
  return Promise.resolve({
    minify: userCtx.stage === "prod"
  });
};
