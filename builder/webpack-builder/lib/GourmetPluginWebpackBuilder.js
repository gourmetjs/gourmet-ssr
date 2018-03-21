"use strict";

const GourmetWebpackBuildInstance = require("./GourmetWebpackBuildInstance");

// ## Lifecycle events
//  before:command:build
//  command:build
//    command:prepare
//    build:client
//      build:webpack:config
//        build:webpack:mode
//        build:webpack:target
//        build:webpack:loaders
//        build:webpack:loader_options:{loader-name}
//    build:server
//      * same as build:client *
//  after:command:build
class GourmetPluginWebpackBuilder {
  // Main handler for `gourmet build` command.
  _onBuildCommand(context) {
    const target = context.argv.target;
    return context.plugins.runAsync("build:prepare", context).then(() => {
      if (!target || target === "all" || target === "client")
        return context.plugins.runAsync("build:client", "client", context);
    }).then(() => {
      if (!target || target === "all" || target === "server")
        return context.plugins.runAsync("build:server", "server", context);
    });
  }

  // Handler for `build:prepare` event
  _onPrepare(context) {
    return context.vars.get("builder", {}).then(config => {
      ["stage", "debug", "minify", "sourceMap", "hashNames", "staticPrefix"].forEach(name => {
        let value;

        if (context.argv[name] !== undefined) {
          value = context.argv[name];   // CLI option has the highest priority
        } else if (config[name] !== undefined) {
          value = config[name];
        } else {
          switch (name) {
            case "stage":
              value = "dev";
              break;
            case "debug":
              value = !(context.stage === "prod" || context.stage === "production");
              break;
            case "minify":
              value = (context.stage === "prod" || context.stage === "production");
              break;
            case "sourceMap":
              value = (context.stage !== "hot" && context.debug);
              break;
            case "hashNames":
              value = (context.stage !== "hot" && context.stage !== "local");
              break;
            case "staticPrefix":
              value = "/s/";
              break;
            default:
              throw Error(`Internal error: add '${name}' to the switch/case`);
          }
        }

        context[name] = value;
      });
    });
  }

  // Handler for `build:(client|server)` event
  _onBuild(target, context) {
    return Promise.resolve().then(() => {
      context.target = target;
      context.build = new GourmetWebpackBuildInstance(context);
    }).then(() => {
      return context.build.init(context);
    }).then(() => {
      return context.plugins.runMergeAsync("build:webpack:config", this._getBaseWebpackConfig(), context).then(config => {
        console.log(require("util").inspect(config, {colors: true, depth: 20}));
      });
    }).then(() => {
      context.target = undefined;
      context.build = undefined;
    });
  }

  _onWebpackConfig(context) {
    return context.build.getWebpackConfig(context);
  }

  _getBaseWebpackConfig() {
    return {
      resolve: {
        extensions: [".js"]
      }
    };
  }
}

GourmetPluginWebpackBuilder.meta = {
  commands: {
    build: {
      help: "Build the bundles & manifests",
      options: {
        stage: {
          help: "Specify the stage (e.g. '--stage prod')",
          short: "s"
        },
        target: {
          help: "Target to build ('client|server|all')",
          short: "t"
        }
      }
    }
  },

  hooks: (proto => ({
    "command:build": proto._onBuildCommand,
    "build:prepare": proto._onPrepare,
    "build:client": proto._onBuild,
    "build:server": proto._onBuild,
    "build:webpack:config": proto._onWebpackConfig
  }))(GourmetPluginWebpackBuilder.prototype)
};

module.exports = GourmetPluginWebpackBuilder;
