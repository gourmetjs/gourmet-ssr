"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/i80-loadable-nested",
    contentHash: context => context.stage === "ltc"
  },

  pages: {
    main: "./src/MainPage.jsx",
    admin: ["./src/initAdmin.js", "./src/AdminPage.jsx"]
  },

  config: {
    html: {
      headTop: [
        '<link href="//stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">'
      ]
    }
  }
};
