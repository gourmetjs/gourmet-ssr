"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/global-css",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: "./src/hello.js",
    admin: "./src/admin.js"
  }
};
