"use strict";

const GourmetWebpackBuildContext = require("GourmetWebpackBuildContext");

// ## Lifecycle events
//  before:command:build
//  command:build
//    build:client
//      build:webpack:loaders
//      build:webpack:loader_options:{loader-name}
//    build:server
//      build:webpack:loaders
//      build:webpack:loader_options:{loader-name}
//  after:command:build
class GourmetPluginWebpackBuilder {
  constructor(gourmet) {
    this.gourmet = gourmet;
    this.meta = {
      commands: {
        build: {
          usage: "Build the bundles",
          options: {
            stage: {
              usage: "Specify the stage (e.g. '--stage prod')",
              shortcut: "s",
              default: "dev"
            },
            client: {
              usage: "Build the server bundle only"
            },
            server: {
              usage: "Build the client bundle only"
            },
            hot: {
              usage: "Build for Hot Module Replacement"
            }
          }
        }
      },
      hooks: {
        "command:build": this._onBuildCommand,
        "build:client": this._onWebpackBuild,
        "build:server": this._onWebpackBuild,
        "build:webpack:config": this._onWebpackConfig,
        "build:webpack:config:module": this._onWebpackConfigModule
      }
    };
  }

  _onBuildCommand(options) {
    return Promise.resolve().then(() => {
      if (!options.server)
        return this.gourmet.plugins.runSeries("build:client", options, this);
    }).then(() => {
      if (!options.client)
        return this.gourmet.plugins.runSeries("build:server", options, this);
    });
  }

  _onWebpackBuild(options) {
    const {plugins, merge} = this.gourmet;
    const build = new GourmetWebpackBuildContext(this, options);

    plugins.runMerge("build:webpack:config", handler => {
      const obj = handler(build);
      merge(build.webpack, obj);
    });
  }

  _onWebpackConfig(build) {
    const plugins = this.gourmet.plugins;
    return {
      module: plugins.runMerge("build:webpack:config:module", {}, build)
    };
  }

  // Creates 'module' section of the webpack config.
  _onWebpackConfigModule(build) {
    const plugins = this.gourmet.plugins;
    const defs = plugins.runMerge("build:webpack:loaders");
    const rules = Object.keys(defs).map(name => {
      const def = defs[name];
      const resource = Object.assign({}, def.resource);

      if (Array.isArray(def.extensions) && def.extensions.length)
        resource.test = this.getExtensionTester(def.extensions);
      else if (Array.isArray(def.notExtensions) && def.notExtensions.length)
        resource.test = this.getNotExtensionTester(def.notExtensions);

      return {
        resource,
        issuer: def.issuer,
        oneOf: this._createRulesFromPipelines(def.pipelines, defs)
      };
    });
    return {rules};
  }

  _createRulesFromPipelines(pipelines, defs) {
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
      rule.use = this._resolveLoaders(pipeline.use, defs);
      return rule;
    });
  }

  _resolveLoaders(items, defs, processed={}) {
    const plugins = this.gourmet.plugins;

    items = items.reduce((arr, item) => {
      if (typeof item === "object" && typeof item.pipeline === "string")
        arr = arr.concat(this._resolvePipeline(item.pipeline, defs, processed));
      else
        arr.push(item);
      return arr;
    }, []);

    return resolvePlugins(items, {
      normalize(item) {
        return {
          name: item.name || (typeof item.loader === "string" ? item.loader : undefined),
          loader: typeof item.loader === "function" ? item.loader : undefined
        };
      },
      finalize(item) {
        const loader = item.loader || item.name;
        const options = plugins.runWaterfall(`build:webpack:loader_options:${item.name}`, item.options, item.name);
        return options ? {loader, options} : loader;
      }
    });
  }

  _resolvePipeline(name, defs, processed={}) {
    function _getDef(name) {
      if (!type)
        throw error(UNKNOWN_RESOURCE_TYPE, {typeName: name});
    }

    if (processed[name])
      throw error(CIRCULAR_PIPELINE, {pipelinePath: name});

    processed[name] = true;

    try {
      const [typeName, pipelineName] = name.split(".");
      const def = _getDef(typeName);
      const pipeline = def.pipelines[pipelineName];
      if (!pipeline || !Array.isArray(pipeline.use) || !pipeline.use.length)
        throw error(INVALID_PIPELINE, {pipelinePath: name});
      const items = pipeline.use;
      return this._resolveLoaders(items, defs, processed);
    } catch (err) {
      if (err.code === "UNKNOWN_RESOURCE_TYPE")
        throw error(INVALID_PIPELINE, {pipelinePath: name});
      throw err;
    }
  }

}

module.exports = GourmetPluginWebpackBuilder;
