"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/fake-github",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: "./src/containers/HelloApp"
  }
};
