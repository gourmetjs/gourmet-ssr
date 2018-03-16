"use strict";

const deepResolve = require("@gourmet/promise-deep-resolve");
const GourmetWebpackBuildContext = require("./GourmetWebpackBuildContext");

// ## Lifecycle events
//  before:command:build
//  command:build
//    build:client
//      build:webpack:config
//        build:webpack:loaders
//        build:webpack:loader_options:{loader-name}
//    build:server
//      * same as build:client *
//  after:command:build
class GourmetPluginWebpackBuilder {
  // Plugin options are not used yet.
  constructor(options, cli) {
    this.cli = cli;
  }

  _onBuildCommand(options) {
    return Promise.resolve().then(() => {
      if (!options.server)
        return this.cli.plugins.runAsync("build:client", options);
    }).then(() => {
      if (!options.client)
        return this.cli.plugins.runAsync("build:server", options);
    });
  }

  _onWebpackBuild(options) {
    const build = new GourmetWebpackBuildContext(this, this.cli, options);
    return this.cli.plugins.runMergeAsync("build:webpack:config", {}, build).then(config => {
      console.log(require("util").inspect(config, {colors: true, depth: 10}));
    });
  }

  _onWebpackConfig(build) {
    return deepResolve({
      module: this.cli.plugins.runMergeAsync("build:webpack:config:module", {}, build)
    });
  }

  // Creates 'module' section of the webpack config.
  _onWebpackConfigModule(build) {
    return deepResolve({
      rules: build.createModuleRules()
    });
  }
}

GourmetPluginWebpackBuilder.meta = {
  commands: {
    build: {
      help: "Build the bundles & manifests",
      options: {
        stage: {
          help: "Specify the stage (e.g. '--stage prod')",
          short: "s",
          default: "dev"
        },
        client: {
          help: "Build the client bundle only"
        },
        server: {
          help: "Build the server bundle only"
        },
        hot: {
          help: "Build for Hot Module Replacement"
        }
      }
    }
  },

  hooks: (proto => ({
    "command:build": proto._onBuildCommand,
    "build:client": proto._onWebpackBuild,
    "build:server": proto._onWebpackBuild,
    "build:webpack:config": proto._onWebpackConfig,
    "build:webpack:config:module": proto._onWebpackConfigModule
  }))(GourmetPluginWebpackBuilder.prototype)
};

module.exports = GourmetPluginWebpackBuilder;
