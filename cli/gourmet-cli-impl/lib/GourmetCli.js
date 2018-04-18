"use strict";

const npath = require("path");
const fs = require("fs");
const resolve = require("resolve");
const promiseProtect = require("@gourmet/promise-protect");
const error = require("@gourmet/error");
const CliBase = require("@gourmet/cli-base");
const Variables = require("@gourmet/variables");
const ContextSource = require("./ContextSource");

const CONFIG_FILE_NOT_FOUND = {
  message: "Project config file 'gourmet.js' or 'gourmet.json' not found in directory '${workDir}'",
  code: "CONFIG_FILE_NOT_FOUND"
};

class GourmetCli extends CliBase {
  init(argv) {
    return promiseProtect(() => {
      super.init(argv);
    }).then(() => {
      return this._loadConfig();
    }).then(() => {
      if (this.context.vars)
        return this._loadUserPlugins();
    });
  }

  verifyArgs() {
    const info = super.verifyArgs();
    if (info.requireConfig && !this.context.vars)
      throw error(CONFIG_FILE_NOT_FOUND, {workDir: this.context.workDir});
  }

  _loadConfig() {
    const exts = [".js", ".json"];

    this.context.package = this._loadModuleSafe(npath.join(this.context.workDir, "package.json"));
    this.context.getter = Variables.getter;

    for (let idx = 0; idx < exts.length; idx++) {
      const ext = exts[idx];
      const path = npath.join(this.context.workDir, "gourmet" + ext);

      if (fs.existsSync(path)) {
        return promiseProtect(() => {
          const config = require(path);
          this.context.console.info("Project configuration:", path);
          return typeof config === "function" ? config(this.context) : config;
        }).then(config => {
          this._initVars(config);
        });
      }
    }
  }

  _loadUserPlugins() {
    return this.context.vars.getMulti(["autoLoadPlugins", "prepend"], ["plugins", []]).then(([auto, plugins]) => {
      if (auto === true) {
        if (!plugins.length)
          plugins = this._scanPlugins(auto);
      } else if (auto === "prepend") {
        plugins = this._scanPlugins(auto).concat(plugins);
      } else if (auto === "append") {
        plugins = plugins.concat(this._scanPlugins(auto));
      }
      this.context.console.info(`Loading user plugins (autoLoadPlugins=${auto})...`);
      this.context.plugins.load(plugins, this.context.workDir);
    });
  }

  _initVars(config) {
    const context = this.context;
    context.vars = new Variables(config, {handlerContext: context});
    context.vars.addBuiltinSources({
      argv: context.argv,
      workDir: context.workDir
    });
    context.vars.addSource("context", new ContextSource(context));
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
