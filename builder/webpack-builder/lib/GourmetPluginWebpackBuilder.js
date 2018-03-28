"use strict";

const util = require("util");
const npath = require("path");
const fs = require("fs");
const promiseEach = require("@gourmet/promise-each");
const promiseReadFile = require("@gourmet/promise-read-file");
const promiseProtect = require("@gourmet/promise-protect");
const colors = require("@gourmet/colors");
const error = require("@gourmet/error");
const webpack = require("webpack");
const GourmetWebpackBuildInstance = require("./GourmetWebpackBuildInstance");
const GourmetWebpackAssetManager = require("./GourmetWebpackAssetManager");

const promiseUnlink = util.promisify(fs.unlink);

const INVALID_STAGE_TYPES = {
  message: "'builder.stageTypes' configuration must be an object or a function",
  code: "INVALID_STAGE_TYPES"
};


// ## Lifecycle events
//  before:command:build
//  command:build
//    command:prepare
//    build:client
//      build:webpack:config
//        build:webpack:*
//    build:server
//      * same as build:client *
//  after:command:build
class GourmetPluginWebpackBuilder {
  // Main handler for `gourmet build` command.
  _onBuildCommand(context) {
    const argv = context.argv;

    // TODO: move to a place that makes more sense
    context.colors = argv.colors ? colors : colors.disabled;

    return context.plugins.runAsync("build:prepare", context).then(() => {
      if (argv.target === "all" || argv.target === "client")
        return context.plugins.runAsync("build:client", "client", context);
    }).then(stop => {
      if (!stop && argv.target === "all" || argv.target === "server")
        return context.plugins.runAsync("build:server", "server", context);
    });
  }

  _prepareStageTypes(context) {
    return context.vars.get("builder.stageTypes").then(checker => {
      if (checker === undefined) {
        checker = {
          "local": ["hot", "local"],
          "hot": ["hot"],
          "production": ["prod", "production"]
        };
      }

      if (typeof checker === "object") {
        const types = checker;
        checker = function(stage, type) {
          const entry = types[type];
          return entry && entry.indexOf(stage) !== -1;
        };
      } else if (typeof checker !== "function") {
        throw error(INVALID_STAGE_TYPES);
      }

      context.stageIs = function(type) {
        return checker(this.stage, type);
      };
    });
  }

  // Handler for `build:prepare` event
  _onPrepare(context) {
    return this._prepareStageTypes(context).then(() => {
      return promiseEach(["stage", "debug", "minify", "sourceMap", "hashNames", "staticPrefix"], name => {
        return context.vars.get("builder." + name).then(userValue => {
          let value;

          if (context.argv[name] !== undefined) {
            value = context.argv[name];   // CLI option has the highest priority
          } else if (userValue !== undefined) {
            value = userValue;
          } else {
            switch (name) {
              case "stage":
                value = "dev";
                break;
              case "debug":
                value = !context.stageIs("production");
                break;
              case "minify":
                value = context.stageIs("production");
                break;
              case "sourceMap":
                value = (!context.stageIs("hot") && context.debug);
                break;
              case "hashNames":
                value = !context.stageIs("local");
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
    }).then(() => {
      return this._prepareAssetRecords(context);
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
      return context.plugins.runMergeAsync("build:webpack:config", {}, context).then(config => {
        const build = context.build;
        const colors = context.colors;

        console.log(require("util").inspect(config, {colors: true, depth: 20}));
        console.log(colors.brightYellow(`\n>>> Building '${context.stage}' stage for '${context.target}' target...\n`));

        return this._runWebpack(config, context).then(stats => {
          this._printResults(stats, context);

          return build.finish(stats, context).then(errorExit => {
            if (errorExit) {
              const count = stats.compilation.errors.length;
              console.error(colors.brightRed(`\n${count} compilation error(s)`));
              process.exitCode = 1;
              return true;
            }
          });
        });
      });
    }).then(res => {
      context.target = undefined;
      context.build = undefined;
      return res;
    });
  }

  _onWebpackConfig(context) {
    return context.build.getWebpackConfig(context);
  }

  _runWebpack(config, context) {
    return new Promise((resolve, reject) => {
      let compiler;

      try {
        compiler = webpack(config);
      } catch (err) {
        if (err.name === "WebpackOptionsValidationError") {
          console.error(context.colors.red(err.message));
          process.exit(1);
        } else {
          return reject(err);
        }
      }

      compiler.run((err, stats) => {
        if (err) {
          compiler.purgeInputFileSystem();
          return reject(err);
        }
        resolve(stats);
      });
    });
  }

  _printResults(stats, context) {
    const argv = context.argv;
    const options = {
      colors: argv.colors,
      warnings: true,
      errors: true
    };
    console.log(stats.toString(options));
  }

  _prepareAssetRecords(context) {
    return promiseProtect(() => {
      if (context.hashNames) {
        return this._getAssetRecordsPath(context).then(path => {
          if (context.argv.records === "reset")
            return promiseUnlink(path);
          else
            return promiseReadFile(path);
        });
      }
    }).then(records => {
      context.assets = new GourmetWebpackAssetManager(records, context);
    });
  }

  _getAssetRecordsPath(context) {
    return context.vars.get("webpack.recordsDir", ".webpack").then(dir => {
      return npath.resolve(context.workDir, dir, `assets.${context.stage}-${context.target}.json`);
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
          short: "s"
        },
        target: {
          help: "Target to build ('client|server|all*')",
          short: "t",
          coerce(value) {
            if (!value)
              return "all";
            else if (value !== "client" && value !== "server")
              throw Error("Invalid '--target' option");
            return value;
          }
        },
        debug: {
          help: "Enable debug mode ('--no-debug' to disable)"
        },
        minify: {
          help: "Minify assets ('--no-minify' to disable)"
        },
        sourceMap: {
          help: "Enable source map ('--no-source-map' to disable)"
        },
        hashNames: {
          help: "Hash asset names for long-term caching ('--no-hash-names' to disable)"
        },
        staticPrefix: {
          help: "Static prefix URL (default: '/s/')"
        },
        colors: {
          help: "Use colors in console output (default: true)",
          coerce(value) {
            return value === undefined ? true : value;
          }
        },
        ignoreCompileErrors: {
          help: "Ignore compilation errors and keep continuing"
        },
        records: {
          help: "Update the records file ('reset|update')"
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
