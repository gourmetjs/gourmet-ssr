"use strict";

const npath = require("path");
const ppath = npath.posix;
const fs = require("fs");
const util = require("util");
const crypto = require("crypto");
const mkdirp = require("mkdirp");
const getConsole = require("@gourmet/console");
const prefixLines = require("@gourmet/prefix-lines");
const promiseProtect = require("@gourmet/promise-protect");
const moduleDir = require("@gourmet/module-dir");
const relativePath = require("@gourmet/relative-path");
const HashNames = require("@gourmet/hash-names");
const merge = require("@gourmet/merge");
const error = require("@gourmet/error");
const b62 = require("@gourmet/base-x")("base62");
const GourmetWebpackBuildInstance = require("./GourmetWebpackBuildInstance");
const defaultConfig = require("./defaultConfig");

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

function _isHotFile(name) {
  return name.endsWith(".hot-update.js") || name.endsWith(".hot-update.json");
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
    this._assets = {};
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

  addAsset(filename, path, type) {
    this._assets[filename] = {path, type};
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

  getDirTester(dir, checker) {
    const tester = function(path) {
      const idx = _findDir(path, dir);
      if (idx !== -1) {
        if (typeof checker === "function")
          return checker(path, idx, dir);
        return true;
      }
      return false;
    };

    tester[util.inspect.custom] = function() {
      return `dirTester(${JSON.stringify(dir)})`;
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

  getAssetFilenameGetter(context, {ext, type="blob"}={}) {
    return ({content, path}) => {
      const relPath = relativePath(path, context.workDir);
      const extname = ppath.extname(relPath);
      let name;

      if (context.config.builder.contentHash) {
        name = b62.encode(crypto.createHash("sha1").update(content).digest("hex"));
      } else {
        const dirname = ppath.dirname(relPath);
        const basename = ppath.basename(relPath, extname);
        const hash = this.pathHash.get(dirname);
        name = hash + "." + basename;
      }

      if (this.shortenerHash)
        name = this.shortenerHash.get(name);

      name += (ext || extname);

      context.builder.addAsset(name, relPath, type);

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
            const deps = ep.getFiles().filter(name => {
              return !name.endsWith(".map") && !_isHotFile(name);
            });
            const assets = target === "client" ? _assets(deps) : [];
            res[name] = assets.concat(deps);
          });
        }
        return res;
      }

      function _assets(deps) {
        // Reverse map {"src_path": "asset_filename"}
        const map = Object.keys(allAssets).reduce((obj, name) => {
          const info = allAssets[name];
          if (info.type.startsWith("global_"))
            obj[info.path] = name;
          return obj;
        }, {});
        const assets = [];

        deps.forEach(name => {
          const info = files[name];
          if (info && info.modules) {
            info.modules.forEach(id => {
              const path = modules[id];
              if (path && map[path])
                assets.push(map[path]);
            });
          }
        });

        return assets;
      }

      function _files() {
        const files = {};
        const assets = compilation.assets;

        Object.keys(assets).forEach(name => {
          if (!_isHotFile(name)) {
            const ext = npath.extname(name).toLowerCase();
            const asset = assets[name];
            const info = files[name] = Object.assign({
              size: asset.size(),
              modules: (ext === ".js") ? [] : undefined
            }, allAssets[name]);
            if (!info.type && info.modules)
              info.type = "bundle";
          }
        });

        compilation.chunks.forEach(chunk => {
          chunk.files.forEach(name => {
            const info = files[name];
            if (info && info.modules)
              info.modules = Array.from(chunk.modulesIterable).map(m => m.id);
          });
        });

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
        // We don't use `m.nameForCondition()` here because it works for
        // only handful of cases.
        if (m.resource)
          return relativePath(m.resource, context.workDir);

        const moduleType = m.constructor.name;

        if (moduleType === "ExternalModule")
          return "@extern:" + _resource(m.request);

        if (moduleType === "MultiModule")
          return "@multi:" + m.dependencies.map(m => _path(m)).join(":");

        if (moduleType === "ConcatenatedModule")
          return _path(m.rootModule);

        if (moduleType === "SingleEntryDependency") // this always comes together with MultiModule?
          return _path(m.module);

        context.console.warn("Unknown module type:", moduleType);
        return null;
      }

      const compilation = stats[target].compilation;
      const config = context.builds[target].config;
      const files = _files();
      const modules = _modules();
      const pages = _pages();

      const obj = [
        "debug", "minify", "sourceMap"
      ].concat(target === "client" ? [
        "staticPrefix", "granularity", "shortenNames",
        "hashLength", "contentHash"
      ] : []).reduce((obj , name) => {
        obj[name] = config.builder[name];
        return obj;
      }, {});

      Object.assign(obj, {
        compilation: compilation.hash,
        pages,
        files,
        modules
      });

      return obj;
    }

    const allAssets = this._assets;
    const obj = {stage: context.stage};

    if (!stats) {
      stats = {
        server: context.builds.server.webpack.stats,
        client: context.builds.client.webpack.stats
      };
    }

    return this._collectManifestConfig(context).then(config => {
      obj.server = _section("server");
      obj.client = _section("client");
      obj.config = config;

      const path = npath.join(context.outputDir, context.stage, "server/manifest.json");
      const content = JSON.stringify(obj, null, context.builds.server.config.builder.minify ? 0 : 2);

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
      return context.vars.get("builder.debug");
    }).then(debug => {
      context.debug = debug;
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

    context.vars.getSource("config").addLower(defaultConfig);

    const args = [
      "outputDir", "debug", "minify", "sourceMap",
      "granularity", "shortenNames", "contentHash", "hashLength"
    ].reduce((obj, name) => {
      if (argv[name] !== undefined)
        obj[name] = argv[name];
      return obj;
    }, {});

    context.vars.getSource("config").addUpper({builder: args});

    return context.vars.get("builder.outputDir").then(dir => {
      context.outputDir = npath.resolve(context.workDir, dir || ".gourmet");
    });
  }

  _prepareStageTypes(context) {
    return context.vars.get("builder.stageTypes").then(checker => {
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

  _prepareHashConfig(context) {
    function _flipCase(s) {
      const buf = [];
      for (let idx = 0; idx < s.length; idx++) {
        let code = s.charCodeAt(idx);
        if (code >= 65 && code <= 90)
          code += 32;
        else if (code >= 97 && code <= 122)
          code -= 32;
        buf.push(code);
      }
      return String.fromCharCode(...buf);
    }

    return context.vars.getMulti(
      "builder.hashLength",
      "builder.shortenNames"
    ).then(([
      hashLength,
      shortenNames
    ]) => {
      mkdirp.sync(context.outputDir);

      const flipped = _flipCase(context.outputDir);
      const insensitive = fs.existsSync(flipped);

      if (shortenNames) {
        this.pathHash = new HashNames({
          digestLength: 27,
          avoidCaseCollision: false
        });
        this.shortenerHash = new HashNames({
          digestLength: hashLength,
          avoidCaseCollision: insensitive
        });
      } else {
        this.pathHash = new HashNames({
          digestLength: hashLength,
          avoidCaseCollision: insensitive
        });
      }
    });
  }

  _collectManifestConfig(context) {
    if (this._manifestConfig)
      return Promise.resolve(this._manifestConfig);

    this._manifestConfig = context.plugins.runMergeSync("build:manifest_config", {}, context);

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
        minify: {
          help: "Minify asset content ('--no-minify' to disable)"
        },
        sourceMap: {
          help: "Generate source map ('--no-source-map' to disable)"
        },
        granularity: {
          help: "Set bundling granularity (0: off, 1: coarse - HTTP/1, 2: fine - HTTP/2"
        },
        shortenNames: {
          help: "Make output file names short using truncated hash digests"
        },
        contentHash: {
          help: "Generate content hash based asset names to support long-term caching"
        },
        hashLength: {
          help: "Length of hash digest of asset names"
        },
        config: {
          help: "Arbitrary config value ('--config.builder.staticPrefix /ss/' becomes `{builder:{staticPrefix:\"/ss\"}'"
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
        saveWebpackStats: {
          help: "Save Webpack's stats.json file"
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
