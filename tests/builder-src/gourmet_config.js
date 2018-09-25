"use strict";

module.exports = context => ({
  builder: {
    installSourceMapSupport: false,
    sourceModules: context.getter(() => {
      return context.stage === "test" ? ["@gourmet/test-builder-src-module-a"] : [];
    }),
    runtime: context.getter(() => {
      return context.stage === "test" ? {client: null, server: "4"} : {client: null, server: "8"};
    })
  },
  pages: {
    main: "./src/main.js"
  }
});
