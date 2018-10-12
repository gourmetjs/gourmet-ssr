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
const WebpackPluginChunkNameShortener = require("@gourmet/webpack-plugin-chunk-name-shortener");
const resolve = require("resolve");
const webpack = require("webpack");

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

const INVALID_MODULE_LINK_VALUE = {
  message: "'moduleLinks.${name}' entry has an invalid value. Must be true, false or 'external'.",
  code: "INVALID_MODULE_LINK_VALUE"
};

const MODULE_LINK_VALUES = [false, null, "server", "client", "external", "client:external"];

const NODE_MODULES = "/node_modules/";

// Don't forget that an instance of this class is kept and reused in `--watch`
// mode whenever a change occurs. Change of `gourmet_config.js` in a watch
// session doesn't need to be applied.
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
      return context.plugins.runAsync("build:init", context);
    });
  }

  run(context) {
    return context.plugins.runMergeAsync("build:config", {}, context).then(config => {
      this.webpack.config = config;
      this.webpack.compiler = webpack(config);

      if (context.target === "client" && context.builder.shortenerHash) {
        const compiler = this.webpack.compiler;
        const plugin = new WebpackPluginChunkNameShortener({hashNames: context.builder.shortenerHash});
        plugin.apply(compiler);
      }

      const con = this.console;

      con.debug(con.colors.brightYellow(`>>> Webpack config for ${context.target}:`));
      con.print({level: "debug", indent: 2}, util.inspect(config, {colors: con.useColors, depth: 20}));

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
      }
    });
  }

  getConfig(context) {
    // These are assigned as direct members of `this.config` because they are
    // generic and relatively Webpack independent. Also, setting as members allow
    // hooks later in the sequence to reference values set by previous hooks.
    this.config = {};
    this.config.defaultExtensions = this.getDefaultExtensions(context);
    this.config.moduleLinks = this.getModuleLinks(context);
    this.config.alias = this.getAlias(context);
    this.config.define = this.getDefine(context);
    this.config.pipelines = this.getPipelines(context);
    this.config.loaders = this.getLoaders(context);
    this.config.plugins = this.getWebpackPlugins(context);
    this.config.webpack = this.getWebpackConfig(context);

    return this.config.webpack;
  }

  getDefaultExtensions(context) {
    const ext = [".js", ".json"];
    context.plugins.runMergeSync("build:default_extensions", ext, context);
    return merge(ext, this._varsCache.builder.defaultExtensions);
  }

  getModuleLinks(context) {
    const links = {};
    context.plugins.runMergeSync("build:module_links", links, context);
    return merge(links, this._varsCache.builder.moduleLinks);
  }

  getAlias(context) {
    const alias = {};
    context.plugins.runMergeSync("build:alias", alias, context);
    return merge(alias, this._varsCache.builder.alias);
  }

  getDefine(context) {
    const define = {
      "process.env.NODE_ENV": JSON.stringify(context.debug ? "development" : "production"),
      DEBUG: JSON.stringify(context.debug),
      SERVER: JSON.stringify(context.target === "server"),
      CLIENT: JSON.stringify(context.target === "client"),
      STAGE: JSON.stringify(context.stage)
    };
    context.plugins.runMergeSync("build:define", define, context);
    return merge(define, this._varsCache.builder.define);
  }

  getPipelines(context) {
    const pipelines = {};
    context.plugins.runMergeSync("build:pipelines", pipelines, context);
    return merge(pipelines, this._varsCache.webpack.pipelines);
  }

  getLoaders(context) {
    const loaders = {};
    context.plugins.runMergeSync("build:loaders", loaders, context);
    return merge(loaders, this._varsCache.webpack.loaders);
  }

  getWebpackPlugins(context) {
    const plugins = [];
    context.plugins.runMergeSync("build:webpack_plugins", plugins, context);
    return merge(plugins, this._varsCache.webpack.plugins);
  }

  getWebpackConfig(context) {
    const config = {
      context: this._getWebpackContext(context),
      target: this._getWebpackTarget(context),
      mode: this._getWebpackMode(context),
      devtool: this._getWebpackDevTool(context),
      optimization: this._getWebpackOptimization(context),
      output: this._getWebpackOutput(context),
      resolve: this._getWebpackResolve(context),
      module: this._getWebpackModule(context),
      externals: this._getWebpackExternals(context),
      entry: this._getWebpackEntry(context),
      plugins: this._getWebpackPlugins(context)
    };
    context.plugins.runMergeSync("build:webpack_config", config, context);
    return merge(config, this._varsCache.webpack.config);
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

  _getWebpackContext(context) {
    return context.workDir;
  }

  _getWebpackTarget(context) {
    return context.target === "client" ? "web" : "node";
  }

  _getWebpackMode(context) {
    return context.minify ? "production" : "development";
  }

  _getWebpackDevTool(context) {
    return context.sourceMap ? "source-map" : false;
  }

  _getWebpackOptimization(context) {
    const granularity = context.target === "client" ? context.granularity : 0;

    return {
      minimize: context.minify,
      runtimeChunk: granularity === 2 ? "single" : false,
      splitChunks: (() => {
        if (!granularity)
          return false;

        let minBundleSize = this._varsCache.builder.minBundleSize;

        if (minBundleSize === undefined)
          minBundleSize = granularity === 2 ? 4000 : 30000;

        const obj = {
          chunks: "all",
          minSize: minBundleSize,
          maxInitialRequests: 10000,
          maxAsyncRequests: 10000
        };

        if (granularity === 1)
          return obj;

        return Object.assign(obj, {
          cacheGroups: {
            vendors: false,
            newVendors: {
              minChunks: 1,
              priority: -10,
              test: this._getVendorTester(context),
              name: this._getVendorNamer(context)
            }
          }
        });
      })(),
      noEmitOnErrors: !context.argv.ignoreCompileErrors && !context.debug
    };
  }

  _getWebpackOutput(context) {
    const name = (context.target === "server" || !context.contentHash) ? "[name].js" : "[name].[contentHash].js";
    return {
      filename: name,
      chunkFilename: name,
      path: npath.join(context.builder.outputDir, context.stage, context.target),
      publicPath: context.staticPrefix,
      hashFunction: "sha1",
      hashDigest: "hex",
      hashDigestLength: 40,
      libraryTarget: context.target === "server" ? "commonjs2" : "var"
    };
  }

  _getWebpackResolve(context) {
    return {
      extensions: this.config.defaultExtensions,
      alias: this._getWebpackAlias(context)
    };
  }

  _getWebpackAlias(context) {
    const links = this.config.moduleLinks;
    const alias = Object.keys(links).reduce((alias, name) => {
      const value = links[name];
      if (MODULE_LINK_VALUES.indexOf(value) !== -1) {
        if (!value ||
            ((value === "server" || value === "client") && context.target !== value) ||
            (value === "external" && context.target !== "server")) {
          alias[name + "$"] = require.resolve("./empty.js");
        }
      } else {
        throw error(INVALID_MODULE_LINK_VALUE, {name});
      }
      return alias;
    }, {});
    return merge(alias, this.config.alias);
  }

  _getWebpackModule(context) {
    return {
      rules: this._getWebpackRules(context)
    };
  }

  _getWebpackRules(context) {
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

    const pipelines = this.config.pipelines;
    const loaders = this.config.loaders;
    const keys = Object.keys(loaders);
    const allExts = [].concat(this.config.defaultExtensions);

    Object.keys(loaders).forEach(name => {
      const def = loaders[name];
      if (Array.isArray(def.extensions))
        return allExts.push(...def.extensions);
    });

    return keys.map(key => {
      const def = loaders[key];
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

  _getWebpackEntry(context) {
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
        value = this._generatePageInit(value, name, context);

      value = context.plugins.runWaterfallSync("build:entry", value, context, name, def);

      res[name] = value.length > 1 ? value : value[0];
    });

    return res;
  }

  _getWebpackExternals(context) {
    if (context.target === "server") {
      const links = this.config.moduleLinks;
      return Object.keys(links).reduce((externals, name) => {
        const value = links[name];
        if (value === "external" || value === "client:external")
          externals[name] = name;
        return externals;
      }, {});
    } else {
      return {};
    }
  }

  _getWebpackPlugins(context) {
    const define = this.config.define;
    const plugins = [].concat(this.config.plugins);
    let idHashLength = this._varsCache.webpack.idHashLength;

    if (idHashLength === undefined)
      idHashLength = 4;

    if (context.target === "client" && idHashLength) {
      plugins.push({
        name: "webpack/HashedModuleIdsPlugin",
        plugin: webpack.HashedModuleIdsPlugin,
        options: {
          hashFunction: "sha1",
          hashDigest: "base64",
          hashDigestLength: this._varsCache.webpack.idHashLength
        }
      });
    }

    if (isPlainObject(define) && Object.keys(define).length > 1) {
      plugins.push({
        name: "webpack/DefinePlugin",
        plugin: webpack.DefinePlugin,
        options: define
      });
    }

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

  _generatePageInit(value, name, context) {
    function _renderer(list) {
      return [
        "[",
        list.map(m => `  require("${m}")`).join(",\n"),
        "].reduce((Base, f) => f(Base), null)"
      ].join("\n");
    }

    const renderer = context.plugins.runMergeSync("build:page_renderer", [], context, value, name);

    if (!renderer || !Array.isArray(renderer) || !renderer.length)
      throw error(NO_RENDERER_CLASS);

    const infoDir = npath.join(context.builder.outputDir, context.stage, "info");
    const outputPath = npath.join(infoDir, `init.${name}.${context.target}.js`);
    const absPath = resolve.sync(value[value.length - 1], {basedir: context.workDir, extensions: this.config.defaultExtensions});
    const userModule = relativePath(absPath, infoDir);
    const iopts = this._varsCache.builder.initOptions;
    const options = iopts ? ", " + JSON.stringify(iopts, null, 2) : "";

    const content = [
      '"use strict"',
      `const Renderer = ${_renderer(renderer)};`,
      `const userObject = require("${userModule}");`,
      `const r = Renderer.create(userObject${options});`,
      context.target === "server" ? "module.exports = r.getRenderer.bind(r);" : "r.render();"
    ].join("\n");

    context.builder.emitFileSync(outputPath, content);

    return value.slice(0, value.length - 1).concat(relativePath(outputPath, context.workDir));
  }

  _getVendorTester(context) {
    return module => {
      let path = module.nameForCondition && module.nameForCondition();
      if (path) {
        path = relativePath(path, context.workDir);
        return path.lastIndexOf(NODE_MODULES) !== -1;
      }
      return false;
    };
  }

  _getVendorNamer(context) {
    return module => {
      let path = module.nameForCondition && module.nameForCondition();
      if (path) {
        path = relativePath(path, context.workDir);
        const idx = path.lastIndexOf(NODE_MODULES);
        if (idx !== -1) {
          const pos = idx + NODE_MODULES.length;
          const mod = this._getModuleName(path, pos);
          const prefix = path.substring(0, pos - 1);
          return context.builder.pathHash.get(prefix) + "." + mod;
        }
      }
      return "vendors";
    };
  }

  _getModuleName(path, pos) {
    let idx = path.indexOf("/", pos);
    if (idx !== -1) {
      if (path[pos] === "@") {
        idx = path.indexOf("/", idx + 1);
        if (idx !== -1)
          return path.substring(pos + 1, idx).replace("/", ".");
      } else {
        return path.substring(pos, idx);
      }
    }
    throw Error("Cannot find a module name from the path: " + path);
  }
}

module.exports = GourmetWebpackBuildInstance;
