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
    staticPrefix: "/s/",

    // Specify the level of granularity of bundling.
    // This only applies to client. Server compilation is always set to 0.
    // - 0: do not split
    //      - one bundle per page
    // - 1: moderate level, suitable for HTTP/1
    //      - one common `vendors` bundle for modules from `node_modules`
    //      - 
    //      - one bundle containing non-vendor modules per page 
    // - 2: fine level, suitable for HTTP/2
    //      - a common `runtime` bundle for Webpack bootstrapping
    //      - separate bundle per a module from `node_modules`
    //      - one bundle containing non-vendor modules per page
    granularity: context.getter(() => context.stageIs("production") ? 2 : 1),

    // If this is true, asset filenames contain their content hash to
    // support long-term caching.
    contentHash: false,

    // Customize bundling
    bundles: {
      // react: ["react", "react-dom"],   // from `node_modules`
      // lib: ["./utils", "./shared"]     // relative path from `workDir`
    },

    // minBundleSize = granularity === 2 ? 4000 : 30000
    minBundleSize: context.getter(() => context.granularity === 2 ? 4000 : 30000),

    // This specifies the length of base62 encoded hash prefix for a path.
    // It is tested against 3 million file paths that 'base62:8' doesn't make
    // any collision, including lowercased paths to simulate case insensitive
    // file systems. Based on this experimentation, 10 appears to be a safe
    // number with sufficient margin.
    pathHashLength: 10,

    // Length of base62 hash digest.
    // It is tested against 3 million file paths that 'base62:8' doesn't make
    // any collision, including lowercased paths to simulate case insensitive
    // file systems. But in real use, content hash might see more collisions.
    // We have a safeguard for collisions by dynamically increase truncating
    // You can always increase this value to avoid collisions in the first
    // place at the price of increased bundle size (and also invalidation
    // of all current bundles).
    hashLength: 8,

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
