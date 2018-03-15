"use strict";

const npath = require("path");
const fs = require("fs");
const resolve = require("resolve");
const isPromise = require("promise-box/lib/isPromise");
const error = require("@gourmet/error");
const CliBase = require("@gourmet/cli-base");
const Variables = require("@gourmet/variables");
const Self = require("@gourmet/variables/lib/sources/Self");
const Env = require("@gourmet/variables/lib/sources/Env");
const Opt = require("@gourmet/variables/lib/sources/Opt");
const File = require("@gourmet/variables/lib/sources/File");

const CONFIG_FILE_NOT_FOUND = {
  message: "Config file 'gourmet.js' or 'gourmet.json' not found in directory '${workDir}'",
  code: "CONFIG_FILE_NOT_FOUND"
};

class GourmetCli extends CliBase {
  loadConfig() {
    const exts = [".js", ".json"];

    this.package = this._loadModuleSafe(npath.join(this.workDir, "package.json"));

    for (let idx = 0; idx < exts.length; idx++) {
      const ext = exts[idx];
      const path = npath.join(this.workDir, "gourmet" + ext);

      if (fs.existsSync(path)) {
        let config = require(path);

        if (typeof config === "function")
          config = config(this);

        if (!isPromise(config))
          config = Promise.resolve(config);

        return config.then(config => {
          this._initVars(config);
        });
      }
    }

    throw error(CONFIG_FILE_NOT_FOUND, {workDir: this.workDir});
  }

  loadUserPlugins() {
    return Promise.all([
      this.vars.get("autoLoadPlugins"),
      this.vars.get("plugins")
    ]).then(([
      auto="prepend",   // false | true | "prepend" | "append"
      plugins=[]
    ]) => {
      if (auto === true) {
        if (!plugins.length)
          plugins = this._scanPlugins(auto);
      } else if (auto === "prepend") {
        plugins = this._scanPlugins(auto).concat(plugins);
      } else if (auto === "append") {
        plugins = plugins.concat(this._scanPlugins(auto));
      }
      this.plugins.load(plugins, this.workDir);
    });
  }

  _initVars(config) {
    const vars = this.vars = new Variables(config);
    vars.addSource("self", new Self(vars));
    vars.addSource("env", new Env());
    vars.addSource("opt", new Opt(this.options));
    vars.addSource("file", new File(vars, this.workDir, this));
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
    if (auto && this.package) {
      const deps = Object.assign({}, this.package.dependencies, this.package.devDependencies);
      return Object.keys(deps).filter(dep => this._isAutoLoadablePlugin(dep));
    }
    return [];
  }

  _isAutoLoadablePlugin(moduleName) {
    const path = resolve.sync(moduleName + "/package.json", {basedir: this.workDir});
    const pkg = require(path);
    const keywords = pkg.keywords;
    return keywords && Array.isArray(keywords) && keywords.indexOf("gourmet-plugin") !== -1;
  }
}

module.exports = GourmetCli;
