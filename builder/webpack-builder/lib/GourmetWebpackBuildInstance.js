"use strict";

const deepResolve = require("@gourmet/promise-deep-resolve");
const error = require("@gourmet/error");
const sortPlugins = require("@gourmet/plugin-sort");

const UNKNOWN_RESOURCE_TYPE = {
  message: "Unknown resource type '${typeName}'",
  code: "UNKNOWN_RESOURCE_TYPE"
};

const INVALID_PIPELINE = {
  message: "Pipeline '${pipelineName}' is not defined or invalid",
  code: "INVALID_PIPELINE"
};

const CIRCULAR_PIPELINE = {
  message: "Pipeline '${pipelinePath}' is has a circular reference",
  code: "CIRCULAR_PIPELINE"
};

class GourmetWebpackBuildInstance {
  constructor(context) {
    this.context = context;
  }

  init() {
  }

  getWebpackConfig(context) {
    return deepResolve({
      target: this.getWebpackTarget(context),
      mode: this.getWebpackMode(context),
      devtool: this.getWebpackDevTool(context),
      optimizations: this.getWebpackOptimization(context),
      entry: this.getWebpackEntry(context),
      module: {
        rules: this.getWebpackModuleRules(context)
      },
    });
  }

  getWebpackMode(context) {
    return context.minify ? "production" : "development";
  }

  getWebpackTarget(context) {
    return context.target === "client" ? "web" : "node";
  }

  getWebpackDevTool(context) {
    return context.vars.get("webpack.devtool").then(value => {
      if (value !== undefined)
        return value;

      if (context.target === "client") {
        if (context.stage === "hot")
          return context.sourceMap ? "cheap-eval-source-map" : "eval";
        else if (context.stage === "local")
          return context.sourceMap ? "eval-source-map" : null;
      }

      return context.sourceMap ? "source-map" : null;
    });
  }

  getWebpackOptimization(context) {
    return {
      minimize: context.minify,
      runtimeChunk: context.target === "client",
      splitChunks: (() => {
        if (context.target === "server" || context.stage === "hot" || context.stage === "local")
          return false;

        return {
          chunks: "all",
          minSize: 10000,
          maxInitialRequests: 20,
          maxAsyncRequests: 20
        };
      })()
    };
  }

  getWebpackEntry(context) {

  }

  getWebpackModuleRules(context) {
    return context.plugins.runMergeAsync("build:webpack:loaders", {}, context).then(defs => {
      this._resourceTypes = defs;

      // Collect all unique extensions that were used by the loaders
      const allExts = Object.keys(this._resourceTypes).reduce((exts, name) => {
        const def = this._resourceTypes[name];
        if (Array.isArray(def.extensions))
          return exts.concat(def.extensions);
        else
          return exts;
      }, []);

      return Object.keys(this._resourceTypes).map(name => {
        const def = this._resourceTypes[name];
        const resource = Object.assign({}, def.resource);

        if (Array.isArray(def.extensions) && def.extensions.length)
          resource.test = this.getExtensionTester(def.extensions);
        else if (def.extensions === "*")
          resource.exclude = this.getExtensionTester(allExts);

        return {
          resource,
          issuer: def.issuer,
          oneOf: this._createRulesFromPipelines(def.pipelines)
        };
      });
    });
  }

  getVendorDirTester() {
    return /[\\/]node_modules[\\/]/;
  }

  getExtensionTester(extensions) {
    let exts;
    if (extensions.length > 1)
      exts = "(?:" + extensions.join("|") + ")";
    else if (extensions.length)
      exts = extensions[0];
    else
      exts = "";
    return new RegExp("\\." + exts + "(?:\\?.*)?$");
  }

  getResourceType(name) {
    const type = this._resourceTypes[name];
    if (!type)
      throw error(UNKNOWN_RESOURCE_TYPE, {typeName: name});
    return type;
  }

  _createRulesFromPipelines(pipelines) {
    function _order(name) {
      const n = pipelines[name].order;
      if (typeof n === "number")
        return n;
      if (name === "default")
        return 9999;
      if (name === "vendor")
        return 9000;
      return 5000;
    }

    const names = Object.keys(pipelines).sort((a, b) => {
      const ia = _order(a);
      const ib = _order(b);
      if (ia === ib) {
        if (a > b)
          return 1;
        else if (a < b)
          return -1;
        else
          return 0;
      } else {
        return ia - ib;
      }
    });

    return names.map(name => {
      const pipeline = pipelines[name];
      const rule = {};
      for (const prop in pipeline) {
        if (pipeline.hasOwnProperty(prop) && prop !== "use" && prop !== "order")
          rule[prop] = pipeline[prop];
      }
      rule.use = this._resolveLoaders(pipeline.use);
      return rule;
    });
  }

  _resolveLoaders(items, processed={}) {
    const context = this.context;

    items = items.reduce((arr, item) => {
      if (typeof item === "object" && typeof item.pipeline === "string")
        arr = arr.concat(this._resolvePipeline(item.pipeline, processed));
      else
        arr.push(item);
      return arr;
    }, []);

    return sortPlugins(items, {
      normalize(item) {
        return Object.assign({}, item, {
          name: item.name || (typeof item.loader === "string" ? item.loader : undefined),
          loader: typeof item.loader === "function" ? item.loader : undefined
        });
      },
      finalize: item => {
        const loader = item.loader || item.name;
        const options = context.plugins.runWaterfallSync(`build:webpack:finalize_loader_options:${item.name}`, item.options, item.name, context);
        return options ? {loader, options} : loader;
      }
    });
  }

  _resolvePipeline(name, processed={}) {
    if (processed[name])
      throw error(CIRCULAR_PIPELINE, {pipelinePath: name});

    processed[name] = true;

    try {
      const [typeName, pipelineName] = name.split(".");
      const def = this.getResourceType(typeName);
      const pipeline = def.pipelines[pipelineName];
      if (!pipeline || !Array.isArray(pipeline.use) || !pipeline.use.length)
        throw error(INVALID_PIPELINE, {pipelinePath: name});
      const items = pipeline.use;
      return this._resolveLoaders(items, processed);
    } catch (err) {
      if (err.code === "UNKNOWN_RESOURCE_TYPE")
        throw error(INVALID_PIPELINE, {pipelinePath: name});
      throw err;
    }
  }
}

module.exports = GourmetWebpackBuildInstance;
