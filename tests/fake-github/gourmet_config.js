"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/fake-github",
    granularity: 2,
    sourceMap: false,
    contentHash: context => context.stage === "ltc",
    bundles: {
      react: ["react", "react-dom"],
      components: "./src/components",
      containers: "./src/containers"
    }
  },

  pages: {
    main: "./src/containers/HelloApp"
  }
};
