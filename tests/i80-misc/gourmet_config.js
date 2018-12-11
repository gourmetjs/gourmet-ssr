"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/i80-misc",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: "./src/MainPage.jsx"
  }
};
