"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/react-hello",
    contentHash: context => context.stage === "ltc",

    initOptions: {
      server: {dataPropertyName: "__INIT_DATA__"},
      client: {dataPropertyName: "__INIT_DATA__"}
    },

    moduleLinks: {
      "react": "client:external",
      "react-dom/server": "external"
    }
  },

  pages: {
    main: "./src/HelloApp.jsx"
  }
};
