"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/render-error",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    "client_error": "./src/ClientError.js",
    "server_error": "./src/ServerError.js",
    "init_error": "./src/InitError.js"
  }
};
