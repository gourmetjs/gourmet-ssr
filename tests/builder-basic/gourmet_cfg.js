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
      "production": ["prod", "production"]
    },
    debug: context.getter(() => !context.stageIs("production")),
    minify: context.getter(() => context.stageIs("production")),
    sourceMap: context.getter(() => !context.stageIs("production")),
    hashNames: false,
    staticPrefix: "/s/",

    // `runtime` is located here as an independent section from Webpack or Babel
    // because the format is kinda standardized based on browserlist and
    // can be used for other purposes such as CSS compilation.
    runtime: {
      client: null,   // browserlist's default
      server: "6.1"   // node 6.10
    },

    // Options to be given to the init function
    initOptions: null,

    // If true, a global hook is installed in `Error` class to display stack trace
    // based on source maps.
    // Only used when `target` is "server" and `sourceMap` is true.
    installSourceMapSupport: true,

    // Additional default extensions to append
    // Default: [".js", ".json"]
    // With `@gourmet/preset-react`: [".js", ".json", ".jsx"]
    defaultExtensions: [],

    // Module alias definitions. Output `context.build.alias` is generated from
    // `moduleLinks` and `alias`.
    alias: {},

    // These are defined by default
    //  - process.env.NODE_ENV = context.debug ? "development" : "production"
    //  - DEBUG: context.debug
    //  - SERVER: context.target === "server"
    //  - CLIENT: context.target === "client"
    //  - STAGE: context.stage
    define: {},

    // Explicitly specifies modules in `node_modules` to be included in compilation.
    // In order to make a module to be compiled by default, implement a gourmet plugin
    // that taps into `build:source_modules` hook.
    //  - `sourceModules: ["@gourmet/http-headers"]`
    //  - `sourceModules: context.getter(() => context.target === "client" ? ["@gourmet/http-headers"] : [])`
    sourceModules: [],

    // Specifies modules to be either client-only, server-only or external(server-only)
    //   {
    //     jquery: "client",
    //     "react-dom/server": "server",
    //     "react-dom": "client",
    //     "aws-sdk": "external",
    //     "useless-module": false  // or null
    //   }
    moduleLinks: {}
  },

  webpack: {
    recordsDir: ".webpack",
    hashFunction: "sha1",
    hashLength: 24,
    pipelines: {},
    loaders: {},
    plugins: []
  },

  pages: {
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
