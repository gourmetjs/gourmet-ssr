"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/multi-views",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: "./src/MainPage.js"
  }
};
