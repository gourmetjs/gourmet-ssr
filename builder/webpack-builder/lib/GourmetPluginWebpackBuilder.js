"use strict";

const npath = require("path");
const util = require("util");
const getConsole = require("@gourmet/console");
const prefixLines = require("@gourmet/prefix-lines");
const promiseEach = require("@gourmet/promise-each");
const promiseReadFile = require("@gourmet/promise-read-file");
const promiseWriteFile = require("@gourmet/promise-write-file");
const promiseProtect = require("@gourmet/promise-protect");
const error = require("@gourmet/error");
const HashNames = require("@gourmet/hash-names");
const omit = require("lodash.omit");
const GourmetWebpackBuildInstance = require("./GourmetWebpackBuildInstance");
const recordsFile = require("./recordsFile");

const INVALID_STAGE_TYPES = {
  message: "'builder.stageTypes' configuration must be an object or a function",
  code: "INVALID_STAGE_TYPES"
};


// ## Lifecycle events
//  before:command:build
//  command:build
//    build:go
//      build:prepare
//      build:client
//        build:webpack:config
//          build:webpack:*
//      build:server
//        * same as build:client *
//      build:finish
//  after:command:build
class GourmetPluginWebpackBuilder {
  constructor(options, context) {
    this.globalAssets = {};
    context.builder = this;

    // TODO: implement separate consoles for client and server
    const con = getConsole();
    getConsole.install({
      writeToConsole(opts, text) {
        const target = opts.target || this.target;
        if (target) {
          const color = target === "server" ? con.colors.yellow : con.colors.magenta;
          text = prefixLines(color(`${target}>`) + " ", text);
        }
        con.writeToConsole(opts, text);
      }
    });
  }

  addGlobalAsset(filename) {
    this.globalAssets[filename] = true;
  }

  getExtensionTester(extensions) {
    const exts = extensions.reduce((exts, ext) => {
      exts[ext] = true;
      return exts;
    }, {});

    const tester = function(path) {
      const idx = path.indexOf("?");
      if (idx !== -1)
        path = path.substr(0, idx);
      const ext = npath.extname(path);
      return exts[ext];
    };

    tester[util.inspect.custom] = function() {
      return `extensionTester(${JSON.stringify(extensions)})`;
    };

    return tester;
  }

  getTestNegator(tester) {
    const negator = function(path) {
      return !tester(path);
    };

    negator[util.inspect.custom] = function(depth, options) {
      return "!" + util.inspect(tester, options);
    };

    return negator;
  }

  getChunkFilenameGetter(context) {
    return function({chunk}) {
      if (context.target === "server" || !context.hashNames)
        return `${chunk.name || chunk.id}_bundle.js`;
      else
        return context.records.chunks.getName(chunk.hash) + ".js";
    };
  }

  getAssetFilenameGetter(context, {ext, isGlobal}={}) {
    return function({content, path}) {
      let name = context.records.files.getName(content);

      const extname = npath.extname(path);
      const basename = npath.basename(path, extname);

      if (!context.hashNames)
        name += "." + basename;

      name += (ext || extname);

      if (isGlobal)
        context.builder.addGlobalAsset(name);

      return name;
    };
  }

  // From: https://github.com/webpack/webpack/blob/3047bed42761a0bed8b48a1d2b8ed292308ea3a1/lib/Compiler.js#L312
  emitFile(path, content, fs) {
    return new Promise((resolve, reject) => {
      function _writeFile() {
        fs.writeFile(path, content, err => {
          if (err)
            reject(err);
          else
            resolve();
        });
      }

      const idx1 = path.lastIndexOf("/");
      const idx2 = path.lastIndexOf("\\");

      let dir = null;

      if (idx1 > idx2)
        dir = path.substr(0, idx1);
      else if (idx1 < idx2)
        dir = path.substr(0, idx2);

      if (!dir)
        return _writeFile();

      fs.mkdirp(dir, err => {
        if (err)
          return reject(err);
        _writeFile();
      });
    });
  }

  // Main handler for `gourmet build` command.
  _onCommand(context) {
    context.console.info("GourmetBuilder: executing 'build' command...");
    return context.plugins.runAsync("build:go", context);
  }

  _onGo(context) {
    // Build instances
    context.builds = {};

    return context.plugins.runAsync("build:prepare", context).then(() => {
      if (context.watchMode || context.argv.target === "all" || context.argv.target === "server")
        return context.plugins.runAsync("build:server", "server", context);
    }).then(() => {
      if (context.watchMode || context.argv.target === "all" || context.argv.target === "client")
        return context.plugins.runAsync("build:client", "client", context);
    }).then(() => {
      if (!context.watchMode)
        return context.plugins.runAsync("build:finish", context);
    });
  }

  // Handler for `build:prepare` event
  _onPrepare(context) {
    return this._init(context).then(() => {
      return this._prepareStageTypes(context);
    }).then(() => {
      return this._prepareContextVars(context);
    }).then(() => {
      return this._prepareBuildRecords(context);
    });
  }

  // Handler for `build:(client|server)` event
  _onBuild(target, context) {
    let build;
    return promiseProtect(() => {
      context.target = target;
      build = context.builds[target] = new GourmetWebpackBuildInstance(context);
      return build.init(context);
    }).then(() => {
      return build.run(context);
    }).then(() => {
      if (!context.watchMode)
        return build.finish(context);
    }).then(() => {
      context.target = undefined;
    });
  }

  _onFinish(context) {
    return promiseProtect(() => {
      if (!context.watchMode && context.builds.server.webpack.stats && context.builds.client.webpack.stats)
        return this._finishBuildRecords(context);
    });
  }

  _init(context) {
    return context.vars.get("builder.outputDir", ".gourmet").then(dir => {
      this.outputDir = npath.resolve(context.workDir, dir);
    });
  }

  _prepareStageTypes(context) {
    return context.vars.get("builder.stageTypes").then(checker => {
      if (checker === undefined) {
        checker = {
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

  _prepareContextVars(context) {
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
              value = context.watchMode !== "hot" && context.debug;
              break;
            case "hashNames":
              value = context.minify;
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

  _onWebpackConfig(context) {
    return context.builds[context.target].getWebpackConfig(context);
  }

  _prepareBuildRecords(context) {
    return this._getUserBuildRecordsPath(context).then(userPath => {
      return this._getBuildRecordsPath(context).then(recPath => {
        return recordsFile.prepare(userPath, recPath, context.argv.records).then(() => {
          return this._loadBuildRecords(recPath).then(records => {
            context.records = records;
          });
        });
      });
    });
  }

  _finishBuildRecords(context) {
    return this._getUserBuildRecordsPath(context).then(userPath => {
      return this._getBuildRecordsPath(context).then(recPath => {
        return this._saveBuildRecords(recPath, context.records).then(() => {
          return recordsFile.finish(userPath, recPath, context.argv.records);
        });
      });
    });
  }

  _loadBuildRecords(path) {
    const records = {
      chunks: new HashNames(),
      files: new HashNames()
    };
    return promiseReadFile(path, "utf8").then(content => {
      const obj = JSON.parse(content);
      if (obj.chunks)
        records.chunks.deserialize(obj.chunks);
      if (obj.files)
        records.files.deserialize(obj.files);
      Object.assign(records, omit(obj, ["chunks", "files"]));
      return records;
    }).catch(err => {
      if (err.code !== "ENOENT")
        throw err;
      return records;
    });
  }

  _saveBuildRecords(path, records) {
    const obj = Object.assign({
      chunks: records.chunks.serialize(),
      files: records.files.serialize()
    }, omit(records, ["chunks", "files"]));
    const content = JSON.stringify(obj, null, 2);
    return promiseWriteFile(path, content, "utf8");
  }

  _getUserBuildRecordsPath(context) {
    return context.vars.get("webpack.recordsDir", ".webpack").then(dir => {
      dir = npath.resolve(context.workDir, dir);
      return npath.join(dir, context.stage, "build.json");
    });
  }

  _getBuildRecordsPath(context) {
    return Promise.resolve(npath.join(this.outputDir, context.stage, "info", "build.json"));
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
          help: "Use colors in console output (default: auto)"
        },
        verbose: {
          short: "v",
          help: "Set verbosity level (0-5, default: 3)"
        },
        ignoreCompileErrors: {
          help: "Ignore compilation errors and continue"
        },
        records: {
          help: "Update the records file ('save|revert|clean|update')"
        }
      }
    }
  },

  hooks: (proto => ({
    "command:build": proto._onCommand,
    "build:go": proto._onGo,
    "build:prepare": proto._onPrepare,
    "build:client": proto._onBuild,
    "build:server": proto._onBuild,
    "build:webpack:config": proto._onWebpackConfig,
    "build:finish": proto._onFinish
  }))(GourmetPluginWebpackBuilder.prototype)
};

module.exports = GourmetPluginWebpackBuilder;
