"use strict";

module.exports = {
  autoLoadPlugins: "prepend",
  plugins: [],

  // Builder configuration
  builder: {
    stageTypes: {
      "production": ["prod", "production"]
    },

    // Where to put output files, resolved from `context.workDir`.
    outputDir: ".gourmet",

    debug: context => !context.stageIs("production"),
    minify: context => context.stageIs("production"),
    sourceMap: context => !context.stageIs("production"),

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
    granularity: context => context.stageIs("production") ? 2 : 1,

    // If this is true, output file names are shortened using truncated hash digests
    shortenNames: context => context.stageIs("production"),

    // If this is true, asset filenames contain their content hash to
    // support long-term caching.
    contentHash: false,

    // This specifies the length of base62 encoded hash digest used for asset
    // file names.
    // It is tested against 3 million file paths that 'base62:8' doesn't make
    // any collision, including lowercased paths to simulate case insensitive
    // file systems.
    hashLength: async context => {
      const contentHash = await context.vars.get("builder.contentHash");
      return contentHash ? 10 : 8;
    },

    // Customize bundling
    bundles: {
      // react: ["react", "react-dom"],   // from `node_modules`
      // lib: ["./utils", "./shared"]     // relative path from `workDir`
    },

    // Minimum size of bundles in bytes to keep bundles from being too small.
    minBundleSize: async context => {
      const granularity = await context.vars.get("builder.granularity");
      return granularity === 2 ? 4000 : 30000;
    },

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

    // Module alias definitions. Output `context.build.config.alias` is generated from
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
    // Setting non-zero value enables hashed module IDs instead of numbers.
    idHashLength: context => context.stageIs("production") ? 4 : 0,

    pipelines: {},
    loaders: {},
    plugins: []
  },

  pages: {
  },

  config: {
  }
};
