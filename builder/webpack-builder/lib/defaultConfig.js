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

    // Minimum size of bundles in bytes to keep them from being too small.
    minBundleSize: async context => {
      const granularity = await context.vars.get("builder.granularity");
      return granularity === 2 ? 0 : 30000;
    },

    // `runtime` is located here as an independent section from Webpack or Babel
    // because the format is kinda standardized based on the browserlist and
    // can be used for other purposes such as CSS compilation.
    // We set `client` to browserslist's default + `ie 11` for the safety.
    runtime: {
      client: "> 0.5%, last 2 versions, Firefox ESR, not dead, ie 11",
      server: "node 8.11"
    },

    // Options to be given to the init function
    initOptions: null,

    // If true, a global hook is installed in `Error` class to display stack trace
    // based on source maps.
    // Only used when `target` is "server" and `sourceMap` is true.
    installSourceMapSupport: true,

    // Additional extensions to attach if extension is not given to `require`.
    // With `@gourmet/preset-react`, ".jsx" is added.
    defaultExtensions: [".wasm", ".mjs", ".js", ".json"],

    // Module alias definitions. Final Webpack's alias definitions are
    // generated from `moduleLinks` and `alias`.
    alias: {},

    // Definitions to be provided as free variables
    define: context => ({
      "process.env.NODE_ENV": JSON.stringify(context.debug ? "development" : "production"),
      DEBUG: JSON.stringify(context.debug),
      SERVER: JSON.stringify(context.target === "server"),
      CLIENT: JSON.stringify(context.target === "client"),
      STAGE: JSON.stringify(context.stage)
    }),

    // By default, vendor modules from `node_modules` will not be complied and
    // copied as-is for better build performance.
    // However, source files located under one of these directories
    // will be included in compilation.
    //  - `vendorSourceDirs: ["gourmet-source", "gmsrc"]`
    vendorSourceDirs: ["gourmet-source", "gmsrc"],

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
