"use strict";

module.exports = {
  builder: {
    outputDir: "../../.gourmet/babel-polyfill",
    granularity: 0
  },

  babel: {
    polyfill: context => context.stage.startsWith("entry") ? "entry" : "usage",
    corejs: context => context.stage.endsWith("v2") ? 2 : 3
  },

  pages: {
    main: "./src/main"
  }
};
