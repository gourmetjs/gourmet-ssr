"use strict";

// Note that `context` has only limited properties when main function
// gets called. To access build context properties such as `target` and
// `build`, use `context.getter` in individual properties.
module.exports = context => ({
  autoLoadPlugins: "prepend",
  plugins: [],

  // Builder configuration
  builder: {
    // These properties are provisioned to `context`.
    stage: "dev",
    debug: context.getter(() => !(context.stage === "prod" || context.stage === "production")),
    minify: context.getter(() => (context.stage === "prod" || context.stage === "production")),
    sourceMap: context.getter(() => (context.stage !== "hot" && context.debug)),
    hashNames: context.getter(() => (context.stage !== "hot" && context.stage !== "local")),
    staticPrefix: "/s/",

    runtime: {
      client: null,   // browserlist's default
      server: "6.1"   // node 6.10
    },

    outputDir: ".gourmet"
  },

  babel: {
    loose: true
  },

  webpack: {
    alias: {},
    define: {},
    plugins: []
  },

  entry: {
    main: {
      client: "./src/client.js",
      server: "./src/server.js"
    },
    admin: "./src/admin.js"
  }
});
