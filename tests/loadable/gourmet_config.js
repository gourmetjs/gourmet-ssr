"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/loadable",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: "./src/MainApp.jsx"
  }
};
