"use strict";

// Note that `context` has only limited properties when main function
// gets called. To access build context properties such as `target` and
// `build`, use `context.getter` in individual properties.
module.exports = context => ({
  autoLoadPlugins: "prepend",
  plugins: [],

  // Builder configuration
  builder: {
    stageTypes: {
      "local": ["local"],
      "production": ["prod", "production"]
    },
    debug: context.getter(() => !context.stageIs("production")),
    optimize: context.getter(() => context.stageIs("production")),
    sourceMap: true,
    staticPrefix: "/s/",

    // `runtime` is located here as an independent section from Webpack or Babel
    // because the format is kinda standardized based on browserlist and
    // can be used for other purposes such as CSS compilation.
    runtime: {
      client: null,   // browserlist's default
      server: "6.1"   // node 6.10
    },

    // Options to be given to the init function
    initOptions: null
  },

  webpack: {
    recordsDir: ".webpack",
    hashFunction: "sha1",
    hashLength: 24,
    module: {},
    resolve: {},
    pipelines: {},
    loaders: {},
    output: {},
    alias: {},
    define: {},
    plugins: [],
    config: {}
  },

  entry: {
    main: {
      client: "./src/client.js",
      server: "./src/server.js"
    },
    admin: {
      client: "./src/admin.js",
      server: "./src/admin.js"
    }
  },

  config: {
  }
});
