"use strict";

module.exports = {
  builder: {
    outputDir: "../../.gourmet/builder-babel"
  },

  babel: context => {
    const options = context.target === "client" ? {
      babelrc: true,        // from `src/.babelrc.js`
      browserslist: "root"  // from `package.json`
    } : {
      configFile: true,     // from `babel.config.js`
      browserslist: "file"  // from `src/.browserlistrc`
    };
    return Object.assign(options, {
      envOptions: {
        debug: !process.env.npm_lifecycle_event || !process.env.npm_lifecycle_event.startsWith("test")
      }
    });
  },

  pages: {
    main: "./src/main"
  }
};
