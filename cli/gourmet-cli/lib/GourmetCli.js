"use strict";

const npath = require("path");
const fs = require("fs");
const resolve = require("resolve");
const isPromise = require("promise-box/lib/isPromise");
const error = require("@gourmet/error");
const CliBase = require("@gourmet/cli-base");
const Variables = require("@gourmet/variables");

const CONFIG_FILE_NOT_FOUND = {
  message: "Config file 'gourmet.js' or 'gourmet.json' not found in directory '${workDir}'",
  code: "CONFIG_FILE_NOT_FOUND"
};

class GourmetCli extends CliBase {
  loadConfig() {
    const exts = [".js", ".json"];

    this.context.package = this._loadModuleSafe(npath.join(this.context.workDir, "package.json"));
    this.context.getter = Variables.getter;

    for (let idx = 0; idx < exts.length; idx++) {
      const ext = exts[idx];
      const path = npath.join(this.context.workDir, "gourmet" + ext);

      if (fs.existsSync(path)) {
        let config = require(path);

        if (typeof config === "function")
          config = config(this.context);

        if (!isPromise(config))
          config = Promise.resolve(config);

        return config.then(config => {
          this._initVars(config);
        });
      }
    }

    throw error(CONFIG_FILE_NOT_FOUND, {workDir: this.context.workDir});
  }

  loadUserPlugins() {
    return this.context.vars.get("autoLoadPlugins").then((auto="prepend") => {
      return this.context.vars.get("plugins").then((plugins=[]) => {
        if (auto === true) {
          if (!plugins.length)
            plugins = this._scanPlugins(auto);
        } else if (auto === "prepend") {
          plugins = this._scanPlugins(auto).concat(plugins);
        } else if (auto === "append") {
          plugins = plugins.concat(this._scanPlugins(auto));
        }
        this.context.plugins.load(plugins, this.context.workDir);
      });
    });
  }

  _initVars(config) {
    const context = this.context;
    context.vars = new Variables(config, {handlerContext: context});
    context.vars.addBuiltinSources({
      argv: context.argv,
      workDir: context.workDir
    });
  }

  _loadModuleSafe(path) {
    try {
      return require(path);
    } catch (err) {
      if (err.code !== "MODULE_NOT_FOUND")
        throw err;
      return null;
    }
  }
  
  _scanPlugins(auto) {
    if (auto && this.context.package) {
      const deps = Object.assign({}, this.context.package.dependencies, this.context.package.devDependencies);
      return Object.keys(deps).filter(dep => this._isAutoLoadablePlugin(dep));
    }
    return [];
  }

  _isAutoLoadablePlugin(moduleName) {
    const path = resolve.sync(moduleName + "/package.json", {basedir: this.context.workDir});
    const pkg = require(path);
    const keywords = pkg.keywords;
    return keywords && Array.isArray(keywords) && keywords.indexOf("gourmet-plugin") !== -1;
  }
}

module.exports = GourmetCli;
