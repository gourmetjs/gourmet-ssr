"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/react-hello",
    contentHash: context => context.stage === "ltc",

    initOptions: {
      dataPropertyName: "__INIT_DATA__"
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
