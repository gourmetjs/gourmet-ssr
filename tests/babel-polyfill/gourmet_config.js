"use strict";

module.exports = {
  builder: {
    outputDir: "../../.gourmet/babel-polyfill",
    granularity: 0
  },

  babel: {
    polyfill: context => context.stage === "entry" ? "entry" : "usage"
  },

  pages: {
    main: "./src/main"
  }
};
