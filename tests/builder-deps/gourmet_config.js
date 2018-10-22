"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/builder-deps",
    contentHash: context => context.stage === "ltc",

    installSourceMapSupport: false,
    moduleLinks: {
      "domready": "client",
      "rimraf": "server",
      "classnames": "client:external",
      "mkdirp": "external",
      "none": false
    }
  },

  pages: {
    main: "./src/main"
  }
};
