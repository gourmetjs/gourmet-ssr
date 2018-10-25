"use strict";

module.exports = {
  builder: {
    outputDir: "../../.gourmet/builder-src",
    installSourceMapSupport: false,
    vendorSourceDirs: context => {
      return context.stage === "test" ? ["@gourmet/test-builder-src-module-a"] : ["gourmet-source"];
    },
    runtime: {
      client: "IE 10",
      server: context => context.stage === "test" ? "4" : "8"
    }
  },
  pages: {
    main: "./src/main.js"
  }
};
