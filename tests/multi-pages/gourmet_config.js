"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/multi-pages",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: "./src/MainPage.js",
    dashboard: "./src/DashboardPage.js"
  }
};
