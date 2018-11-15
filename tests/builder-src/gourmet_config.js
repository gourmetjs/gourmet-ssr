"use strict";

module.exports = {
  builder: {
    outputDir: "../../.gourmet/builder-src",
    installSourceMapSupport: false,
    vendorSourceDirs: context => {
      return context.stage === "test" ? ["@gourmet/test-builder-src-module-a"] : ["gourmet-source"];
    },
    granularity: 0,
    runtime: {
      client: "IE 10",
      server: context => context.stage === "test" ? "node 4" : "node 8"
    }
  },
  babel: {
    loose: false
  },
  pages: {
    main: "./src/main.js"
  }
};
