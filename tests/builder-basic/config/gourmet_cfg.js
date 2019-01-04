"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/builder-basic",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: {
      client: "./src/client.js",
      server: "./src/server.mjs"
    },
    admin: {
      client: "./src/admin.js",
      server: "./src/admin.js"
    }
  }
};
