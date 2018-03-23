"use strict";

const npath = require("path");
const promiseEach = require("@gourmet/promise-each");
const colors = require("@gourmet/colors");
const promiseWriteFile = require("@gourmet/promise-write-file");
const webpack = require("webpack");
const GourmetWebpackBuildInstance = require("./GourmetWebpackBuildInstance");

// ## Lifecycle events
//  before:command:build
//  command:build
//    command:prepare
//    build:client
//      build:webpack:config
//        build:webpack:context
//        build:webpack:target
//        build:webpack:mode
//        build:webpack:devtool
//        build:webpack:optimization
//        build:webpack:entry
//        build:webpack:resolve
//        build:webpack:loaders
//        build:webpack:loader_options:{loader-name}
//        build:webpack:output
//        build:webpack:plugins
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

  // Handler for `build:prepare` event
  _onPrepare(context) {
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
      return context.plugins.runMergeAsync("build:webpack:config", {}, context).then(config => {
        const build = context.build;
        const colors = context.colors;

        //console.log(require("util").inspect(config, {colors: true, depth: 20}));
        console.log(colors.brightYellow(`\n>>> Building '${context.stage}' stage for '${context.target}' target...\n`));

        return this._runWebpack(config, context).then(stats => {
          this._printResults(stats, context);

          if (stats.hasErrors() && !context.argv.ignoreCompileErrors) {
            const count = stats.compilation.errors.length;
            console.error(colors.brightRed(`\n${count} compilation error(s)`));
            process.exitCode = 1;
            return true;
          }

          if (build.outputManifest) {
            const path = npath.join(build.outputDir, context.stage, "server", `${context.target}_manifest.json`);
            const content = JSON.stringify(build.outputManifest, null, context.minify ? 0 : 2);
            return promiseWriteFile(path, content, {useOriginalPath: true});
          }
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
          if (context.argv.colors)
            console.error(`\u001b[1m\u001b[31m${err.message}\u001b[39m\u001b[22m`);
          else
            console.error(err.message);
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
