"use strict";

// Note that `context` has only limited properties when main function
// gets called. To access build context properties such as `target` and
// `build`, use `context.getter` in individual properties.
module.exports = context => ({
  autoLoadPlugins: "prepend",
  plugins: [],

  // Builder configuration
  builder: {
    stage: "dev",
    debug: context.getter(() => !(context.stage === "prod" || context.stage === "production")),
    minify: context.getter(() => (context.stage === "prod" || context.stage === "production")),
    sourceMap: context.getter(() => (context.stage !== "hot" && context.debug)),

    runtime: {
      client: null,   // browserlist's default
      server: "6.1"   // node 6.10
    }
  },

  webpack: {
    devtool: context.getter(() => {
      if (context.target === "client") {
        if (context.stage === "hot")
          return context.sourceMap ? "cheap-eval-source-map" : "eval";
        else if (context.stage === "local")
          return context.sourceMap ? "eval-source-map" : null;
      }
      return context.sourceMap ? "source-map" : null;
    })
  }
});
