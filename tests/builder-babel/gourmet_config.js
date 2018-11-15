"use strict";

module.exports = {
  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/builder-babel",
    contentHash: context => context.stage === "ltc"
  },

  babel: context => {
    if (context.target === "client") {
      return {
        babelrc: true,        // from `src/.babelrc.js`
        browserslist: "root"  // from `package.json`
      };
    } else {
      return {
        configFile: true,     // from `babel.config.js`
        browserslist: "file"  // from `src/.browserlistrc`
      };
    }
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
              debug: !process.env.npm_lifecycle_event || !process.env.npm_lifecycle_event.startsWith("test")
            }
          }]
        }
      }]
    }
  },

  pages: {
    main: "./src/main"
  }
};
