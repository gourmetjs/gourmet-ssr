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
const Base62Hash = require("./Base62Hash");

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
    return context.plugins.runMergeAsync("build:user_config", {}, context).then(value => {
      return context.vars.get("").then(config => {
        merge(value, config);
        return context.plugins.runMergeAsync("build:after:user_config", value, context);
      });
    }).then(config => {
      const con = context.console;
      con.debug(con.colors.brightYellow(`>>> Config for ${context.target}:`));
      con.print({level: "debug", indent: 2}, util.inspect(config, {colors: con.useColors, depth: 20}));
      this.config = context.config = config;
      return context.plugins.runAsync("build:init", context);
    });
  }

  run(context) {
    return context.plugins.runMergeAsync("build:config", {}, context).then(config => {
      this.webpack.config = config;
      this.webpack.compiler = webpack(config);

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
        if (context.argv.saveWebpackStats)
          this.saveWebpackStats(context);
        if (this.webpack.stats.hasErrors() && !context.argv.ignoreCompileErrors)
          throw error(COMPILATION_ERROR, {count: this.webpack.stats.compilation.errors.length});
      }
    });
  }

  getConfig(context) {
    return this._getConfigItem(context, "webpack_config", {
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
    }, context.config.webpack.config);
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
    let method = "log";
    if (this.webpack.stats.hasErrors() && !context.argv.ignoreCompileErrors)
      method = "error";
    else if (this.webpack.stats.hasWarnings())
      method = "warn";
    this.console[method](this.webpack.stats.toString(options));
  }

  saveWebpackStats(context) {
    const stats = this.webpack.stats.toJson();
    const path = npath.join(context.outputDir, context.stage, `info/stats.${context.target}.json`);
    const content = JSON.stringify(stats, null, 2);
    context.builder.emitFileSync(path, content);
  }

  _getConfigItem(context, eventName, value, userConfig) {
    context.plugins.runMergeSync(`build:${eventName}`, value, context);
    merge(value, userConfig);
    context.plugins.runMergeSync(`build:after:${eventName}`, value, context);
    return value;
  }

  _getWebpackContext(context) {
    return context.workDir;
  }

  _getWebpackTarget(context) {
    return context.target === "client" ? "web" : "node";
  }

  _getWebpackMode(context) {
    return context.stageIs("production") ? "production" : "development";
  }

  _getWebpackDevTool(context) {
    return context.config.builder.sourceMap ? "source-map" : false;
  }

  _getWebpackOptimization(context) {
    const _bundles = () => {
      const bundles = context.config.builder.bundles;
      return Object.keys(bundles).reduce((obj, name, idx) => {
        obj[name] = {
          priority: 100 + bundles.length - idx,
          minChunks: 1,
          minSize: 0,
          maxSize: 0,
          name: name + ".bundle",
          test: this._getBundleTester(context, bundles[name])
        };
        return obj;
      }, {});
    };

    const granularity = context.target === "client" ? context.config.builder.granularity : 0;

    return {
      minimize: context.config.builder.minify,
      runtimeChunk: granularity === 2 ? "single" : false,
      splitChunks: (() => {
        if (!granularity)
          return false;

        const minBundleSize = context.config.builder.minBundleSize;

        const obj = {
          chunks: "all",
          minSize: minBundleSize,
          maxInitialRequests: 10000,
          maxAsyncRequests: 10000,
          cacheGroups: {}
        };

        if (granularity === 2) {
          Object.assign(obj.cacheGroups, {
            vendors: false,
            newVendors: {
              minChunks: 1,
              priority: -10,
              test: this._getVendorTester(context),
              name: this._getVendorNamer(context)
            }
          });
        }

        Object.assign(obj.cacheGroups, _bundles());

        return obj;
      })(),
      noEmitOnErrors: !context.argv.ignoreCompileErrors && !context.debug
    };
  }

  _getWebpackOutput(context) {
    const hashLength = context.config.builder.hashLength;

    return {
      filename: (context.target === "client" && context.config.builder.contentHash) ? `[contentHash:${hashLength}].js` : "[name].js",
      chunkFilename: (context.target === "client" && context.config.builder.contentHash) ? `[contentHash:${hashLength}].js` : "[name].js",
      path: npath.join(context.outputDir, context.stage, context.target),
      publicPath: context.config.builder.staticPrefix,
      hashFunction: Base62Hash,
      hashDigest: "base64", // actually becomes base62
      hashDigestLength: 27,
      libraryTarget: context.target === "server" ? "commonjs2" : "var"
    };
  }

  _getWebpackResolve(context) {
    return {
      extensions: context.config.builder.defaultExtensions,
      alias: this._getWebpackAlias(context)
    };
  }

  _getWebpackAlias(context) {
    const links = context.config.builder.moduleLinks;
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
    return merge(alias, context.config.builder.alias);
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
          const options = context.plugins.runWaterfallSync(`build:webpack_loader_options:${item.name}`, item.options, item.name, context);
          return options ? {loader, options} : loader;
        }
      });
    }

    const pipelines = this._getConfigItem(context, "webpack_pipelines", {}, context.config.webpack.pipelines);
    const loaders = this._getConfigItem(context, "webpack_loaders", {}, context.config.webpack.loaders);
    const keys = Object.keys(loaders);
    const allExts = [].concat(context.config.builder.defaultExtensions);

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
    const pages = context.config.pages;

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
      const links = context.config.builder.moduleLinks;
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
    const define = context.config.builder.define;
    const plugins = this._getConfigItem(context, "webpack_plugins", [], context.config.webpack.plugins);
    const idHashLength = context.config.webpack.idHashLength;

    if (context.target === "client" && idHashLength) {
      plugins.push({
        name: "webpack/HashedModuleIdsPlugin",
        plugin: webpack.HashedModuleIdsPlugin,
        options: {
          hashFunction: "sha1",
          hashDigest: "base64",
          hashDigestLength: idHashLength
        }
      });
    }

    if (context.target === "client" && !context.config.builder.contentHash && context.builder.shortenerHash) {
      plugins.push({
        name: "@gourmet/webpack-plugin-chunk-name-shortener",
        plugin: WebpackPluginChunkNameShortener,
        options: {
          hashNames: context.builder.shortenerHash,
          console: context.console
        }
      });
    }

    if (isPlainObject(define) && Object.keys(define).length) {
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

    const infoDir = npath.join(context.outputDir, context.stage, "info");
    const outputPath = npath.join(infoDir, `init.${name}.${context.target}.js`);
    const absPath = resolve.sync(value[value.length - 1], {basedir: context.workDir, extensions: context.config.builder.defaultExtensions});
    const userModule = relativePath(absPath, infoDir);
    const iopts = context.config.builder.initOptions;
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

  _getBundleTester(context, dirs) {
    if (typeof dirs === "string")
      dirs = [dirs];

    const testers = dirs.map(dir => {
      if (dir.startsWith("./") || dir.startsWith("../")) {
        if (dir[dir.length - 1] !== "/")
          dir = dir + "/";
        return path => path.startsWith(dir);
      } else {
        if (dir[0] !== "/")
          dir = "/" + dir;
        if (dir[dir.length - 1] !== "/")
          dir = dir + "/";
        dir = "/node_modules" + dir;
        return path => path.indexOf(dir) !== -1;
      }
    });

    return module => {
      let path = module.nameForCondition && module.nameForCondition();
      if (path) {
        path = relativePath(path, context.workDir);
        for (let idx = 0; idx < testers.length; idx++) {
          if (testers[idx](path))
            return true;
        }
      }
      return false;
    };
  }
}

module.exports = GourmetWebpackBuildInstance;
