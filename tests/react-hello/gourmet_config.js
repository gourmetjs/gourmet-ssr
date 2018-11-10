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

  babel: {
    babelrc: true
  },

  webpack: {
    pipelines: {
      js: [{
        virtual: true,
        name: "babel-loader",
        options: {
          presets: [{
            virtual: true,
            name: "@babel/preset-env",
            options: {
              debug: true,
              targets: context => {
                return context.target === "server" ? "node 8.11" : null;
              }
            }
          }]
        }
      }]
    }
  },

  pages: {
    main: "./src/HelloApp.jsx"
  }
};
