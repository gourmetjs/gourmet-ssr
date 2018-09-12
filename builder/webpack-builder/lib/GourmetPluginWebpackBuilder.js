"use strict";

const npath = require("path");
const fs = require("fs");
const util = require("util");
const crypto = require("crypto");
const mkdirp = require("mkdirp");
const getConsole = require("@gourmet/console");
const prefixLines = require("@gourmet/prefix-lines");
const promiseEach = require("@gourmet/promise-each");
const promiseProtect = require("@gourmet/promise-protect");
const moduleDir = require("@gourmet/module-dir");
const relativePath = require("@gourmet/relative-path");
const merge = require("@gourmet/merge");
const error = require("@gourmet/error");
const GourmetWebpackBuildInstance = require("./GourmetWebpackBuildInstance");

const INVALID_STAGE_TYPES = {
  message: "'builder.stageTypes' configuration must be an object or a function",
  code: "INVALID_STAGE_TYPES"
};

function _findDir(path, dir) {
  function _sep(ch) {
    return ch === "\\" || ch === "/";
  }

  let pos = path.length - dir.length;
  while (pos >= 0) {
    const idx = path.lastIndexOf(dir, pos);
    if (idx === -1)
      break;
    if (_sep(path[idx - 1]) && _sep(path[idx + dir.length]))
      return idx;
    pos = idx - dir.length;
  }
  return -1;
}

// ## Lifecycle events
//  before:command:build
//  command:build
//    build:go
//      build:prepare
//      build:client
//        build:config
//          build:...
//      build:server
//        * same as build:client *
//      build:finish
//  after:command:build
class GourmetPluginWebpackBuilder {
  constructor(options, context) {
    this._globalAssets = {};
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

    this.moduleDir = moduleDir;
  }

  addGlobalAsset(filename) {
    this._globalAssets[filename] = true;
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

  getDirTester(dir) {
    const tester = function(path) {
      return _findDir(path, dir) !== -1;
    };

    tester[util.inspect.custom] = function() {
      return `dirTester(${JSON.stringify(dir)})`;
    };

    return tester;
  }

  getVendorDistTester() {
    const tester = function(path) {
      const mod = _findDir(path, "node_modules");
      if (mod !== -1) {
        const src = _findDir(path, "src");
        if (src !== -1 && src > mod)
          return false;
        return true;
      }
      return false;
    };

    tester[util.inspect.custom] = function() {
      return "vendorDistTester()";
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

  getAssetFilenameGetter(context, {ext, isGlobal}={}) {
    return ({content, path}) => {
      const hash = crypto.createHash(this._hashFunction);
      hash.update(content);
      let name = hash.digest("hex").substr(0, this._hashLength);

      const extname = npath.extname(path);
      const basename = npath.basename(path, extname);

      if (!context.optimize)
        name += "." + basename;

      name += (ext || extname);

      if (isGlobal)
        context.builder.addGlobalAsset(name);

      return name;
    };
  }

  emitFileSync(path, content) {
    const dir = npath.dirname(path);

    if (dir)
      mkdirp.sync(dir);

    fs.writeFileSync(path, content);
  }

  writeManifest(context, stats) {
    function _section(target) {
      function _pages() {
        const eps = compilation.entrypoints;
        const res = {};
        if (eps) {
          eps.forEach((ep, name) => {
            const assets = target === "client" ? globalAssets : [];
            res[name] = assets.concat(ep.getFiles().filter(name => {
              return !name.endsWith(".map");
            }));
          });
        }
        return res;
      }

      function _analyze() {
        const assets = compilation.assets;

        Object.keys(assets).forEach(name => {
          const asset = assets[name];
          const info = {size: asset.size()};
          const ext = npath.extname(name).toLowerCase();
          if (ext === ".js")
            info.modules = [];
          files[name] = info;
        });

        compilation.chunks.forEach(chunk => {
          chunk.files.forEach(name => {
            const info = files[name];
            if (info && info.modules)
              info.modules = Array.from(chunk.modulesIterable).map(m => m.id);
          });
        });
      }

      function _files() {
        return files;
      }

      function _modules() {
        return compilation.modules.reduce((obj, m) => {
          obj[m.id] = _path(m);
          return obj;
        }, {});
      }

      function _resource(path) {
        const idx = path.indexOf("?");
        return idx === -1 ? path : path.substr(0, idx);
      }

      function _path(m) {
        if (m.resource)
          return relativePath(_resource(m.resource), context.workDir);

        const moduleType = m.constructor.name;

        if (moduleType === "ExternalModule")
          return "@extern:" + _resource(m.request);

        if (moduleType === "ConcatenatedModule")
          return "@concat:" + _path(m.rootModule);

        if (moduleType === "MultiModule")
          return "@multi:" + m.dependencies.map(m => _path(m)).join(":");

        if (moduleType === "SingleEntryDependency")
          return _path(m.module);

        context.console.warn("Unknown module type:", moduleType);
        return null;
      }

      const compilation = stats[target].compilation;
      const files = {};

      _analyze();

      return {
        compilation: compilation.hash,
        pages: _pages(),
        files: _files(),
        modules: _modules()
      };
    }

    const globalAssets = Object.keys(this._globalAssets);
    const obj = {};

    if (!stats) {
      stats = {
        server: context.builds.server.webpack.stats,
        client: context.builds.client.webpack.stats
      };
    }

    return this._collectManifestConfig(context).then(config => {
      ["stage", "debug", "optimize", "sourceMap", "staticPrefix"].forEach(name => {
        obj[name] = context[name];
      });

      obj.server = _section("server");
      obj.client = _section("client");
      obj.config = config;

      const path = npath.join(this.outputDir, context.stage, "server/manifest.json");
      const content = JSON.stringify(obj, null, context.optimize ? 2 : 2);

      this.emitFileSync(path, content);

      this.manifest = obj;
    });
  }

  // Main handler for `gourmet build` command.
  onCommand(context) {
    context.console.info("GourmetBuilder: executing 'build' command...");
    return context.plugins.runAsync("build:go", context);
  }

  onGo(context) {
    return promiseProtect(() => {
      return context.plugins.runAsync("build:prepare", context);
    }).then(() => {
      return context.plugins.runAsync("build:server", "server", context);
    }).then(() => {
      return context.plugins.runAsync("build:client", "client", context);
    }).then(() => {
      return context.plugins.runAsync("build:finish", context);
    });
  }

  // Handler for `build:prepare` event
  onPrepare(context) {
    return promiseProtect(() => {
      return this._init(context);
    }).then(() => {
      return this._prepareStageTypes(context);
    }).then(() => {
      return this._prepareContextVars(context);
    }).then(() => {
      return this._prepareHashConfig(context);
    });
  }

  // Handler for `build:(client|server)` event
  onBuild(target, context) {
    let build;
    return promiseProtect(() => {
      context.vars.cleanCache();
      context.target = target;
      build = context.builds[target] = new GourmetWebpackBuildInstance(context);
      return build.init(context);
    }).then(() => {
      return build.run(context);
    }).then(() => {
      return build.finish(context);
    }).then(() => {
      context.target = undefined;
    });
  }

  onConfig(context) {
    return context.builds[context.target].getConfig(context);
  }

  onFinish(context) {
    if (context.builds.server.webpack.stats && context.builds.client.webpack.stats) {
      return this.writeManifest(context);
    }
  }

  _init(context) {
    const argv = context.argv;
    context.stage = argv.stage || argv.s || "local";
    context.builds = {};
    this.outputDir = npath.resolve(context.workDir, argv.build || ".gourmet");
  }

  _prepareStageTypes(context) {
    return context.vars.get("builder.stageTypes").then(checker => {
      if (checker === undefined) {
        checker = {
          "local": ["local"],
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
    return promiseEach(["debug", "optimize", "sourceMap", "staticPrefix"], name => {
      return context.vars.get("builder." + name).then(userValue => {
        let value;

        if (context.argv[name] !== undefined) {
          value = context.argv[name];   // CLI option has the highest priority
        } else if (userValue !== undefined) {
          value = userValue;
        } else {
          switch (name) {
            case "debug":
              value = !context.stageIs("production");
              break;
            case "optimize":
              value = context.stageIs("production");
              break;
            case "sourceMap":
              value = true;
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

  _prepareHashConfig(context) {
    return context.vars.getMulti(
      ["webpack.hashFunction", "sha1"],
      ["webpack.hashLength", 24]
    ).then(([func, len]) => {
      this._hashFunction = func;
      this._hashLength = len;
    });
  }

  _collectManifestConfig(context) {
    if (this._manifestConfig)
      return Promise.resolve(this._manifestConfig);

    this._manifestConfig = context.plugins.runMergeSync("build:manifest:config", {}, context);

    return context.vars.get("config").then(config => {
      return merge(this._manifestConfig, config);
    });
  }
}

GourmetPluginWebpackBuilder.meta = {
  commands: {
    build: {
      help: "Build the Gourmet project",
      options: {
        stage: {
          help: "Specify the stage (e.g. '--stage prod')",
          alias: "s"
        },
        debug: {
          help: "Enable debug mode ('--no-debug' to disable)"
        },
        optimize: {
          help: "Enable optimization ('--no-optimize' to disable)"
        },
        sourceMap: {
          help: "Enable source map ('--no-source-map' to disable)"
        },
        staticPrefix: {
          help: "Static prefix URL (default: '/s/')"
        },
        colors: {
          help: "Use colors in console output (default: auto)"
        },
        verbose: {
          alias: "v",
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

  hooks: {
    "command:build": GourmetPluginWebpackBuilder.prototype.onCommand,
    "build:go": GourmetPluginWebpackBuilder.prototype.onGo,
    "build:prepare": GourmetPluginWebpackBuilder.prototype.onPrepare,
    "build:client": GourmetPluginWebpackBuilder.prototype.onBuild,
    "build:server": GourmetPluginWebpackBuilder.prototype.onBuild,
    "build:config": GourmetPluginWebpackBuilder.prototype.onConfig,
    "build:finish": GourmetPluginWebpackBuilder.prototype.onFinish
  }
};

module.exports = GourmetPluginWebpackBuilder;
