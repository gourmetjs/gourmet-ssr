"use strict";

module.exports = {
  builder: {
    outputDir: "../../.gourmet/postcss",
    runtime: {
      client: ["chrome 67", "ie 11"]
    }
  },

  postcss: {
    useConfigFile: context => {
      return context.stage === "config";
    },

    browserslist: context => {
      return context.stage === "file" ? "file" : "gourmet";
    }
  },

  pages: {
    main: "./src/main.js"
  }
};
