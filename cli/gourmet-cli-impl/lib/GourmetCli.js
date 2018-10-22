"use strict";

const npath = require("path");
const fs = require("fs");
const resolve = require("resolve");
const promiseProtect = require("@gourmet/promise-protect");
const error = require("@gourmet/error");
const CliBase = require("@gourmet/cli-base");
const Variables = require("@gourmet/variables");
const ContextSource = require("./ContextSource");
const ConfigSource = require("./ConfigSource");

const CONFIG_FILE_NAME = "gourmet_config";

const CONFIG_FILE_NOT_FOUND = {
  message: "Project config file '${filename}' not found in directory '${workDir}'",
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
    const context = this.context;

    if (!context.vars) {
      const info = this.findCommandInfo(context.command);
      if (!info || info.requiresConfig !== false) {
        const filenames = this._getConfigFilenames();
        const workDir = context.workDir;
        throw error(CONFIG_FILE_NOT_FOUND, {filename: filenames[0], workDir});
      }
    }

    return super.verifyArgs();
  }

  _getConfigFilenames() {
    const context = this.context;
    const basename = context.argv.configName || CONFIG_FILE_NAME;
    const ext = npath.extname(basename).toLowerCase();
    if (ext === ".js" || ext === ".json")
      return [basename];
    return [
      basename + ".js",
      basename + ".json"
    ];
  }

  _loadConfig() {
    const context = this.context;
    const filenames = this._getConfigFilenames();

    context.package = this._loadModuleSafe(npath.join(context.workDir, "package.json"));
    context.getter = Variables.getter;
    context.value = Variables.value;

    for (let idx = 0; idx < filenames.length; idx++) {
      const filename = filenames[idx];
      const path = npath.join(context.workDir, filename);

      if (fs.existsSync(path)) {
        return promiseProtect(() => {
          const config = require(path);
          context.console.info("Project configuration:", path);
          return typeof config === "function" ? config(context) : config;
        }).then(config => {
          this._initVars(config);
        });
      }
    }
  }

  _initVars(config) {
    const context = this.context;

    const vars = context.vars = new Variables(null, {
      defaultSource: "config",
      handlerContext: context,
      functionsAsGetters: true
    });

    const args = process.env.GOURMET_CONFIG_OBJECT ? JSON.parse(process.env.GOURMET_CONFIG_OBJECT) : {};

    vars.addSource("env", new Variables.Env());
    vars.addSource("argv", new Variables.Opt(context.argv));
    vars.addSource("file", new Variables.File(context.workDir));
    vars.addSource("context", new ContextSource(context));
    vars.addSource("config", new ConfigSource(config, args));

    // `--config.foo.bar val` form
    if (context.argv.config)
      vars.getSource("config").addUpper(context.argv.config);
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

  _loadUserPlugins() {
    const context = this.context;
    return context.vars.getMulti(["autoLoadPlugins", "prepend"], ["plugins", []]).then(([auto, plugins]) => {
      if (auto === true) {
        if (!plugins.length)
          plugins = this._scanPlugins(auto);
      } else if (auto === "prepend") {
        plugins = this._scanPlugins(auto).concat(plugins);
      } else if (auto === "append") {
        plugins = plugins.concat(this._scanPlugins(auto));
      }
      context.console.debug(`Loading user plugins (autoLoadPlugins=${auto})...`);
      context.plugins.load(plugins, context.workDir);
    });
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
