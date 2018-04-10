"use strict";

const util = require("util");
const npath = require("path");
const getConsole = require("@gourmet/console");
const error = require("@gourmet/error");
const isPlainObject = require("@gourmet/is-plain-object");
const sortPlugins = require("@gourmet/plugin-sort");
const merge = require("@gourmet/merge");
const promiseProtect = require("@gourmet/promise-protect");
const omit = require("lodash.omit");
const webpack = require("webpack");
const recordsFile = require("./recordsFile");

const INVALID_PIPELINE = {
  message: "Pipeline '${pipeline}' is not defined or invalid",
  code: "INVALID_PIPELINE"
};

const CIRCULAR_PIPELINE = {
  message: "Pipeline '${pipeline}' has a circular reference",
  code: "CIRCULAR_PIPELINE"
};

const INVALID_ENTRY = {
  message: "'entry' must be an object containing at least one entry-point",
  code: "INVALID_ENTRY"
};

const INVALID_ENTRY_VALUE = {
  message: "Entry '${name}' has invalid value",
  code: "INVALID_ENTRY_VALUE"
};

const INVALID_ALIAS = {
  message: "'webpack.alias' must be an object",
  code: "INVALID_ALIAS"
};

const INVALID_DEFINE = {
  message: "'webpack.define' must be an object",
  code: "INVALID_DEFINE"
};

const INVALID_PLUGINS = {
  message: "'webpack.plugins' must be an array",
  code: "INVALID_PLUGINS"
};

const INVALID_WEBPACK_PLUGIN = {
  message: "Webpack plugin entry must be an object with '{name, [plugin]}' shape: ${item}",
  code: "INVALID_WEBPACK_PLUGIN"
};

const COMPILATION_ERROR = {
  message: "${count} compilation error(s)",
  code: "COMPILATION_ERROR"
};

class GourmetWebpackBuildInstance {
  constructor(context) {
    this.target = context.target;
    this.webpack = {};
    this.console = getConsole({
      name: "gourmet:builder",
      target: context.target
    });
  }

  init(context) {
    return context.vars.getMulti("builder", "webpack", "entry").then(([builder, webpack, entry]) => {
      this._varsCache = {
        builder: builder || {},
        webpack: webpack || {},
        entry: entry || {}
      };
    }).then(() => {
      return this._prepareWebpackRecords(context);
    }).then(() => {
      return context.plugins.runAsync("build:webpack:init", context);
    });
  }

  run(context) {
    return context.plugins.runMergeAsync("build:webpack:config", {}, context).then(config => {
      this.webpack.config = config;
      this.webpack.compiler = webpack(config);

      const con = this.console;

      con.info(con.colors.brightYellow(`>>> Webpack config for ${context.target}:`));
      con.print({level: "info", indent: 2}, util.inspect(config, {colors: con.useColors, depth: 20}));

      if (context.watchMode)
        return;

      con.log();
      con.log(con.colors.brightYellow(`>>> Building '${context.stage}' stage for '${context.target}' target...`));
      con.log();

      return new Promise((resolve, reject) => {
        this.webpack.compiler.run((err, stats) => {
          if (err) {
            this.webpack.compiler.purgeInputFileSystem();
            return reject(err);
          }
          this.webpack.stats = stats;
          resolve();
        });
      });
    });
  }

  // This function gets called just once for a normal build. But in watch mode,
  // this will be called multiple times whenever a compilation finishes.
  finish(context) {
    return promiseProtect(() => {
      this.printWebpackResult(context);
      if (this.webpack.stats.hasErrors() && (!context.watchMode && !context.argv.ignoreCompileErrors))
        throw error(COMPILATION_ERROR, {count: this.webpack.stats.compilation.errors.length});
      return this.writeManifest(context).then(() => {
        if (!context.watchMode)
          return this._finishWebpackRecords(context);
      });
    });
  }

  getWebpackConfig(context) {
    return {
      context: this.getWebpackContext(context),
      target: this.getWebpackTarget(context),
      mode: this.getWebpackMode(context),
      devtool: this.getWebpackDevTool(context),
      optimization: this.getWebpackOptimization(context),
      entry: this.getWebpackEntry(context),
      resolve: this.getWebpackResolve(context),
      module: this.getWebpackModule(context),
      output: this.getWebpackOutput(context),
      plugins: this.getWebpackPlugins(context),
      recordsPath: this._recordsPath
    };
  }

  getWebpackContext(context) {
    return context.plugins.runWaterfallSync("build:webpack:context", context.workDir, context);
  }

  getWebpackTarget(context) {
    const target = context.target === "client" ? "web" : "node";
    return context.plugins.runWaterfallSync("build:webpack:target", target, context);
  }

  getWebpackMode(context) {
    const mode = context.minify ? "production" : "development";
    return context.plugins.runWaterfallSync("build:webpack:mode", mode, context);
  }

  getWebpackDevTool(context) {
    function _devtool() {
      if (context.target === "client") {
        if (context.watchMode === "hot")
          return context.sourceMap ? "cheap-eval-source-map" : "eval";
        else if (context.watchMode)
          return context.sourceMap ? "eval-source-map" : false;
      }
      return context.sourceMap ? "source-map" : false;
    }

    return context.plugins.runWaterfallSync("build:webpack:devtool", _devtool(), context);
  }

  getWebpackOptimization(context) {
    const optimization = {
      minimize: context.minify,
      runtimeChunk: context.target === "client",
      splitChunks: (() => {
        if (context.target === "server" || !context.minify)
          return false;

        return {
          chunks: "all",
          minSize: 10000,
          maxInitialRequests: 20,
          maxAsyncRequests: 20
        };
      })()
    };
    return context.plugins.runWaterfallSync("build:webpack:optimization", optimization, context);
  }

  getWebpackEntry(context) {
    const entry = this._varsCache.entry;

    if (!isPlainObject(entry))
      throw error(INVALID_ENTRY);

    const names = Object.keys(entry);

    if (!names.length)
      throw error(INVALID_ENTRY);

    const res = {};

    names.forEach(name => {
      function _value(val) {
        if (typeof val === "string")
          return [val];
        else if (Array.isArray(val))
          return [].concat(val);
        throw error(INVALID_ENTRY_VALUE, {name});
      }

      const def = entry[name];
      let entryValue = _value(isPlainObject(def) ? def[context.target] : def);

      entryValue = context.plugins.runWaterfallSync("build:webpack:entry", entryValue, name, def, context);

      res[name] = (context.watchMode || entryValue.length > 1) ? entryValue : entryValue[0];
    });

    return res;
  }

  getWebpackResolve(context) {
    const alias = this.getWebpackAlias(context);
    const resolve = {extensions: [".js"], alias};
    return context.plugins.runMergeSync("build:webpack:resolve", resolve, context);
  }

  getWebpackAlias(context) {
    let alias = this._varsCache.webpack.alias;
    if (alias !== undefined && !isPlainObject(alias))
      throw error(INVALID_ALIAS);
    alias = Object.assign({}, alias);
    return context.plugins.runMergeSync("build:webpack:alias", alias, context);
  }

  getWebpackModule(context) {
    const rules = this.getWebpackRules(context);
    const module = {rules};
    return context.plugins.runMergeSync("build:webpack:module", module, context);
  }

  getWebpackRules(context) {
    function _resolve(items) {
      function _sort() {
        return items.map((item, idx) => {
          return [item.order !== undefined ? item.order : 5000, idx, item];
        }).sort((a, b) => {
          const oa = a[0] * 10000 + a[1];
          const ob = b[0] * 10000 + b[1];
          return oa - ob;
        }).map(item => item[2]);
      }

      items = _sort();

      return items.map(item => {
        return Object.assign(omit(item, ["pipeline", "order"]), {
          use: _pipeline(item.pipeline)
        });
      });
    }

    function _pipeline(name, processed={}) {
      if (processed[name])
        throw error(CIRCULAR_PIPELINE, {pipeline: name});

      processed[name] = true;

      const pipeline = pipelines[name];

      if (!pipeline || !Array.isArray(pipeline) || !pipeline.length)
        throw error(INVALID_PIPELINE, {pipeline: name});

      return _loaders(pipeline, processed);
    }

    function _loaders(items, processed) {
      items = items.reduce((arr, item) => {
        if (typeof item === "object" && typeof item.pipeline === "string")
          arr = arr.concat(_pipeline(item.pipeline, processed));
        else
          arr.push(item);
        return arr;
      }, []);

      return sortPlugins(items, {
        normalize(item) {
          return Object.assign({}, item, {
            name: item.name || (typeof item.loader === "string" ? item.loader : undefined)
          });
        },
        finalize: item => {
          const loader = item.loader || item.name;
          const options = context.plugins.runWaterfallSync(`build:webpack:loader_options:${item.name}`, item.options, item.name, context);
          return options ? {loader, options} : loader;
        }
      });
    }

    const pipelines = context.plugins.runMergeSync("build:webpack:pipelines", {}, context);
    const defs = context.plugins.runMergeSync("build:webpack:loaders", {}, context);

    const keys = Object.keys(defs);

    const allExts = Object.keys(defs).reduce((exts, name) => {
      const def = defs[name];
      if (Array.isArray(def.extensions))
        return exts.concat(def.extensions);
      else
        return exts;
    }, []);

    return keys.map(key => {
      const def = defs[key];
      let resource = def.resource;

      if (!resource) {
        if (Array.isArray(def.extensions) && def.extensions.length) {
          resource = {
            test: context.builder.getExtensionTester(def.extensions)
          };
        } else if (def.extensions === "*") {
          resource = {
            test: context.builder.getTestNegator(context.builder.getExtensionTester(allExts))
          };
        }
      }

      return {
        resource,
        issuer: def.issuer,
        oneOf: def.oneOf ? _resolve(def.oneOf) : undefined
      };
    });
  }

  getWebpackOutput(context) {
    const getter = context.builder.getChunkFilenameGetter(context);
    const output = {
      filename: getter,
      chunkFilename: getter,
      path: npath.join(context.builder.outputDir, context.stage, context.target),
      publicPath: context.staticPrefix,
      hashFunction: "sha1",
      hashDigestLength: 40
    };
    return context.plugins.runMergeSync("build:webpack:output", output, context);
  }

  getWebpackDefine(context) {
    const define = {
      "process.env.NODE_ENV": JSON.stringify(context.debug ? "development" : "production"),
      DEBUG: JSON.stringify(context.debug),
      SERVER: JSON.stringify(context.target === "server"),
      CLIENT: JSON.stringify(context.target === "client"),
      STAGE: JSON.stringify(context.stage)
    };
    const userDef = this._varsCache.webpack.define;

    if (userDef) {
      if (!isPlainObject(define))
        throw error(INVALID_DEFINE);
      merge(define, userDef);
    }

    return context.plugins.runMergeSync("build:webpack:define", define, context);
  }

  getWebpackPlugins(context) {
    const define = this.getWebpackDefine(context);
    let plugins = [];

    if (isPlainObject(define) && Object.keys(define).length > 1) {
      plugins.push({
        name: "webpack/define-plugin",
        plugin: webpack.DefinePlugin,
        options: define
      });
    }

    const userPlugins = this._varsCache.webpack.plugins;

    if (userPlugins) {
      if (!Array.isArray(userPlugins))
        throw error(INVALID_PLUGINS);
      plugins = plugins.concat(userPlugins);
    }

    context.plugins.runMergeSync("build:webpack:plugins", {plugins}, context);

    return sortPlugins(plugins, {
      normalize(item) {
        if (!isPlainObject(item) || !item.name || typeof item.name !== "string")
          throw error(INVALID_WEBPACK_PLUGIN, {item});
        return item;
      },
      finalize(item) {
        let plugin = item.plugin;
        if (!plugin)
          plugin = require(item.name);
        if (typeof plugin === "function")
          plugin = new plugin(item.options);
        return plugin;
      }
    });
  }

  writeManifest(context) {
    function _eps() {
      const eps = compilation.entrypoints;
      const res = {};
      if (eps) {
        eps.forEach((ep, name) => {
          res[name] = globalAssets.concat(ep.getFiles().filter(name => !name.endsWith(".map")));
        });
      }
      return res;
    }

    function _files() {
      return Object.keys(compilation.assets);
    }

    const globalAssets = context.target === "client" ? Object.keys(context.builder.globalAssets) : [];
    const compiler = this.webpack.compiler;
    const compilation = this.webpack.stats.compilation;
    const obj = {target: this.target};

    ["stage", "debug", "minify", "sourceMap", "hashNames", "staticPrefix"].forEach(name => {
      obj[name] = context[name];
    });

    Object.assign(obj, {
      compilation: compilation.hash,
      entrypoints: _eps(),
      files: _files()
    });

    const path = npath.join(context.builder.outputDir, context.stage, "server", `${this.target}_manifest.json`);
    const content = JSON.stringify(obj, null, context.minify ? 0 : 2);

    return context.builder.emitFile(path, content, compiler.outputFileSystem).then(() => {
      this.manifest = obj;
    });
  }

  printWebpackResult() {
    const options = {
      colors: this.console.useColors,
      warnings: true,
      errors: true
    };
    this.console.log(this.webpack.stats.toString(options));
  }

  _prepareWebpackRecords(context) {
    return recordsFile.prepare(
      this._getUserWebpackRecordsPath(context),
      this._recordsPath = this._getWebpackRecordsPath(context),
      context.argv.records
    );
  }

  _finishWebpackRecords(context) {
    return recordsFile.finish(
      this._getUserWebpackRecordsPath(context),
      this._getWebpackRecordsPath(context),
      context.argv.records
    );
  }

  _getUserWebpackRecordsPath(context) {
    const dir = npath.resolve(context.workDir, this._varsCache.webpack.recordsDir || ".webpack");
    return npath.join(dir, context.stage, `webpack.${this.target}.json`);
  }

  _getWebpackRecordsPath(context) {
    const dir = npath.join(context.builder.outputDir, context.stage, "info");
    return npath.join(dir, `webpack.${this.target}.json`);
  }
}

module.exports = GourmetWebpackBuildInstance;
