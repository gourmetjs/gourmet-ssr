"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/builder-ltc",
    granularity: 2,
    sourceMap: false,
    contentHash: context => context.stage === "ltc"
  },
  pages: {
    main: "./src/main.js"
  }
};
