"use strict";

const util = require("util");
const npath = require("path");
const getConsole = require("@gourmet/console");
const error = require("@gourmet/error");
const HandledError = require("@gourmet/error/HandledError");
const isPlainObject = require("@gourmet/is-plain-object");
const sortPlugins = require("@gourmet/plugin-sort");
const merge = require("@gourmet/merge");
const promiseProtect = require("@gourmet/promise-protect");
const omit = require("@gourmet/omit");
const relativePath = require("@gourmet/relative-path");
const resolve = require("resolve");
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

const INVALID_PAGES = {
  message: "'pages' must be an object containing at least one page",
  code: "INVALID_PAGES"
};

const INVALID_PAGE_VALUE = {
  message: "Page '${name}' has invalid value",
  code: "INVALID_PAGE_VALUE"
};

const INVALID_USER_OBJECT = {
  message: "'webpack.${sectionName}' must be a plain object",
  code: "INVALID_USER_OBJECT"
};

const INVALID_USER_ARRAY = {
  message: "'webpack.${sectionName}' must be an array",
  code: "INVALID_USER_ARRAY"
};

const INVALID_WEBPACK_PLUGIN = {
  message: "Webpack plugin entry must be an object with '{name, [plugin]}' shape: ${item}",
  code: "INVALID_WEBPACK_PLUGIN"
};

const COMPILATION_ERROR = {
  ErrorClass: HandledError,
  message: "${count} compilation error(s)",
  code: "COMPILATION_ERROR"
};

const NO_RENDERER_CLASS = {
  message: "Renderer class is required but not defined by any plugins. Check your dependencies and try again.",
  code: "NO_RENDERER_CLASS"
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
    return context.vars.getMulti("builder", "webpack", "pages").then(([builder, webpack, pages]) => {
      this._varsCache = {
        builder: builder || {},
        webpack: webpack || {},
        pages: pages || {}
      };
    }).then(() => {
      return this._prepareRecords(context);
    }).then(() => {
      return context.plugins.runAsync("build:init", context);
    });
  }

  run(context) {
    return context.plugins.runMergeAsync("build:config", {}, context).then(config => {
      this.webpack.config = config;
      this.webpack.compiler = webpack(config);

      const con = this.console;

      con.info(con.colors.brightYellow(`>>> Webpack config for ${context.target}:`));
      con.print({level: "info", indent: 2}, util.inspect(config, {colors: con.useColors, depth: 20}));

      if (context.watch)
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

  finish(context) {
    return promiseProtect(() => {
      if (!context.watch) {
        this.printResult(context);
        if (this.webpack.stats.hasErrors() && !context.argv.ignoreCompileErrors)
          throw error(COMPILATION_ERROR, {count: this.webpack.stats.compilation.errors.length});
        return this._finishRecords(context);
      }
    });
  }

  getConfig(context) {
    const _get = (section, method) => {
      config[section] = method.call(this, context, config);
      if (userConfig && userConfig[section])
        merge(config[section], userConfig[section]);
    };

    const config = {};
    const userConfig = this._varsCache.webpack.config;

    _get("context", this.getContext);
    _get("target", this.getTarget);
    _get("mode", this.getMode);
    _get("devtool", this.getDevTool);
    _get("optimization", this.getOptimization);
    _get("output", this.getOutput);
    _get("resolve", this.getResolve);
    _get("module", this.getModule);
    _get("entry", this.getEntry);
    _get("plugins", this.getPlugins);

    config.recordsPath = this._recordsPath;

    return config;
  }

  getContext(context, config) {
    return context.plugins.runWaterfallSync("build:context", context.workDir, context, config);
  }

  getTarget(context, config) {
    const target = context.target === "client" ? "web" : "node";
    return context.plugins.runWaterfallSync("build:target", target, context, config);
  }

  getMode(context, config) {
    const mode = context.optimize ? "production" : "development";
    return context.plugins.runWaterfallSync("build:mode", mode, context, config);
  }

  getDevTool(context, config) {
    function _devtool() {
      if (context.target === "client") {
        if (context.watch === "hot")
          return context.sourceMap ? "cheap-eval-source-map" : false;
        else if (context.watch)
          return context.sourceMap ? "cheap-module-source-map" : false;
      }
      return context.sourceMap ? "source-map" : false;
    }

    return context.plugins.runWaterfallSync("build:devtool", _devtool(), context, config);
  }

  getOptimization(context, config) {
    const optimization = {
      minimize: context.optimize,
      runtimeChunk: context.target === "client",
      splitChunks: (() => {
        if (context.target === "server" || !context.optimize)
          return false;

        return {
          chunks: "all",
          minSize: 10000,
          maxInitialRequests: 20,
          maxAsyncRequests: 20
        };
      })()
    };
    return context.plugins.runWaterfallSync("build:optimization", optimization, context, config);
  }

  getEntry(context, config) {
    const pages = this._varsCache.pages;

    if (!isPlainObject(pages))
      throw error(INVALID_PAGES);

    const names = Object.keys(pages);

    if (!names.length)
      throw error(INVALID_PAGES);

    const res = {};

    names.forEach(name => {
      function _value(val) {
        if (typeof val === "string")
          return [val];
        else if (Array.isArray(val))
          return [].concat(val);
        throw error(INVALID_PAGE_VALUE, {name});
      }

      const def = pages[name];
      let value = _value(isPlainObject(def) ? def[context.target] : def);

      if (!isPlainObject(def))
        value = this._generatePageInit(value, name, context, config);

      value = context.plugins.runWaterfallSync("build:entry", value, name, def, context, config);

      res[name] = (context.watch || value.length > 1) ? value : value[0];
    });

    return res;
  }

  getResolve(context, config) {
    const alias = this.getAlias(context, config);
    const resolve = {extensions: [".js", ".json"], alias};
    return this._runMergeSync("build:resolve", resolve, "resolve", context, config);
  }

  getAlias(context, config) {
    return this._runMergeSync("build:alias", {}, "alias", context, config);
  }

  getModule(context, config) {
    const rules = this.getRules(context, config);
    const module = {rules};
    return this._runMergeSync("build:module", module, "module", context, config);
  }

  getRules(context, config) {
    function _resolve(select) {
      function _sort() {
        return Object.keys(select).map((key, idx) => {
          const item = select[key];
          return [item.order !== undefined ? item.order : 5000, idx, item];
        }).sort((a, b) => {
          const oa = a[0] * 10000 + a[1];
          const ob = b[0] * 10000 + b[1];
          return oa - ob;
        }).map(item => item[2]);
      }

      const items = _sort();

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

      if (!pipeline || !Array.isArray(pipeline))
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
          const options = context.plugins.runWaterfallSync(`build:loader_options:${item.name}`, item.options, item.name, context);
          return options ? {loader, options} : loader;
        }
      });
    }

    const pipelines = this._runMergeSync("build:pipelines", {}, "pipelines", context, config);
    const defs = this._runMergeSync("build:loaders", {}, "loaders", context, config);

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
      let test = [];

      if (Array.isArray(def.extensions))
        test = context.builder.getExtensionTester(def.extensions);
      else if (def.extensions === "*")
        test = context.builder.getTestNegator(context.builder.getExtensionTester(allExts));

      return {
        test,
        issuer: def.issuer,
        oneOf: def.select ? _resolve(def.select) : undefined
      };
    });
  }

  getOutput(context, config) {
    const vars = this._varsCache.webpack;
    const name = (context.target === "server" || !context.optimize) ? "[name].bundle.js" : "[chunkHash].js";
    const output = {
      filename: name,
      chunkFilename: name,
      path: npath.join(context.builder.outputDir, context.stage, context.target),
      publicPath: context.staticPrefix,
      hashFunction: vars.hashFunction || "sha1",
      hashDigestLength: vars.hashLength || 24
    };
    return this._runMergeSync("build:output", output, "output", context, config);
  }

  getDefine(context, config) {
    return this._runMergeSync("build:define", {
      "process.env.NODE_ENV": JSON.stringify(context.debug ? "development" : "production"),
      DEBUG: JSON.stringify(context.debug),
      SERVER: JSON.stringify(context.target === "server"),
      CLIENT: JSON.stringify(context.target === "client"),
      STAGE: JSON.stringify(context.stage)
    }, "define", context, config);
  }

  getPlugins(context, config) {
    const define = this.getDefine(context, config);
    let plugins = [];

    if (isPlainObject(define) && Object.keys(define).length > 1) {
      plugins.push({
        name: "webpack/define-plugin",
        plugin: webpack.DefinePlugin,
        options: define
      });
    }

    plugins = this._runMergeSync("build:plugins", plugins, "plugins", context, config);

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

  printResult(context) {
    const debug = this.console.enabled({level: "debug"});
    const argv = context.argv;
    const options = {
      colors: this.console.useColors,
      warnings: true,
      errors: true,
      errorDetails: debug || argv.errorDetails,
      maxModules: (debug || argv.displayModules) ? Infinity : 15
    };
    this.console.log(this.webpack.stats.toString(options));
  }

  _prepareRecords(context) {
    return recordsFile.prepare(
      this._getUserRecordsPath(context),
      this._recordsPath = this._getRecordsPath(context),
      context.argv.records
    );
  }

  _finishRecords(context) {
    return recordsFile.finish(
      this._getUserRecordsPath(context),
      this._getRecordsPath(context),
      context.argv.records
    );
  }

  _getUserRecordsPath(context) {
    const dir = npath.resolve(context.workDir, this._varsCache.webpack.recordsDir || ".webpack");
    return npath.join(dir, context.stage, `webpack-records.${this.target}.json`);
  }

  _getRecordsPath(context) {
    const dir = npath.join(context.builder.outputDir, context.stage, "info");
    return npath.join(dir, `webpack-records.${this.target}.json`);
  }

  _runMergeSync(eventName, obj, sectionName, context, config, ...args) {
    let wrapped = false;

    if (Array.isArray(obj)) {
      wrapped = true;
      obj = {
        [sectionName]: obj
      };
    }

    context.plugins.runMergeSync(eventName, obj, context, config, ...args);

    const userObj = (sectionName && this._varsCache.webpack && this._varsCache.webpack[sectionName]);

    if (userObj) {
      if (wrapped) {
        if (!Array.isArray(userObj))
          throw error(INVALID_USER_ARRAY, {sectionName});
        merge(obj, {[sectionName]: userObj});
      } else {
        if (!isPlainObject(userObj))
          throw error(INVALID_USER_OBJECT, {sectionName});
        merge(obj, userObj);
      }
    }

    if (wrapped)
      return obj[sectionName];
    else
      return obj;
  }

  _generatePageInit(value, name, context, config) {
    function _renderer(list) {
      return [
        "[",
        list.map(m => `  require("${m}")`).join(",\n"),
        "].reduce((Base, f) => f(Base), null)"
      ].join("\n");
    }

    const info = context.plugins.runMergeSync("build:page_renderer", {renderer: []}, context, config, value, name);

    if (!info.renderer || !Array.isArray(info.renderer) || !info.renderer.length)
      throw error(NO_RENDERER_CLASS);

    const infoDir = npath.join(context.builder.outputDir, context.stage, "info");
    const outputPath = npath.join(infoDir, `init.${name}.${context.target}.js`);
    const absPath = resolve.sync(value[value.length - 1], {basedir: context.workDir, extensions: config.resolve.extensions});
    const userModule = relativePath(absPath, infoDir);
    const iopts = this._varsCache.builder.initOptions;
    const options = iopts ? ", " + JSON.stringify(iopts, null, 2) : "";

    const content = [
      '"use strict"',
      `const Renderer = ${_renderer(info.renderer)};`,
      `const userObject = require("${userModule}");`,
      `const r = Renderer.create(userObject${options});`,
      context.target === "server" ? "__gourmet_module__.exports = r.getRenderer.bind(r);" : "r.render();"
    ].join("\n");

    context.builder.emitFileSync(outputPath, content);

    return value.slice(0, value.length - 1).concat(relativePath(outputPath, context.workDir));
  }
}

module.exports = GourmetWebpackBuildInstance;
