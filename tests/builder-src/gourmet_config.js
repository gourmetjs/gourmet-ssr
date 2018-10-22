"use strict";

module.exports = {
  builder: {
    outputDir: "../../.gourmet/builder-src",
    installSourceMapSupport: false,
    sourceModules: context => {
      return context.stage === "test" ? ["@gourmet/test-builder-src-module-a"] : [];
    },
    runtime: {
      client: null,
      server: context => context.stage === "test" ? "4" : "8"
    }
  },
  pages: {
    main: "./src/main.js"
  }
};
