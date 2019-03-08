"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/news",
    contentHash: context => context.stage === "ltc",
    alias: {
      "__NewsData__$": context => {
        if (context.target === "server")
          return "@gourmet/test-news-view/gmsrc/NewsDataServer";
        else
          return "@gourmet/test-news-view/gmsrc/NewsDataClient";
      }
    }
  },

  pages: {
    main: "./src/NewsApp.jsx"
  },

  config: {
    html: {
      headTop: [
        '<link href="//stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">',
        '<link href="//use.fontawesome.com/releases/v5.0.12/css/all.css" rel="stylesheet" integrity="sha384-G0fIWCsCzJIMAVNQPfjH08cyYaUtMwjJwqiRKxxE/rx96Uroj1BtIQ6MLJuheaO9" crossorigin="anonymous">'
      ]
    }
  }
};
