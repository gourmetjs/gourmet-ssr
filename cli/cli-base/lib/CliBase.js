"use strict";

const npath = require("path");
const fs = require("fs");
const error = require("@gourmet/error");
const DefaultPluginManager = require("./PluginManager");

const CONFIG_FILE_NOT_FOUND = {
  message: "Config file '${configBaseName}.js' or '${configBaseName}.json' not found",
  code: "CONFIG_FILE_NOT_FOUND"
};

class CliBase {
  constructor({
    configBaseName,
    builtinPlugins,
    isPackageRequired=false,
    isConfigRequired=true,
    autoLoadPlugins="prepend",    // false | true | "prepend" | "append"
    workDir="",
    defaultCommand="help",
    configPropNames={
      plugins: "plugins",
      autoLoadPlugins: "autoLoadPlugins"
    },
    PluginManager=DefaultPluginManager
  }) {
    this.workDir = npath.resolve(process.cwd(), workDir);
    this.package = this._loadPackage(isPackageRequired);

    this._config = this._loadConfig(configBaseName, isConfigRequired);

    this.plugins = new PluginManager();

    this._loadBuiltinPlugins(builtinPlugins);
    this._loadPlugins(autoLoadPlugins, configPropNames);
  }

  // Override and return `true` if the dependency is an auto-loadable plugin
  isAutoLoadablePlugin(moduleName) {   // eslint-disable-line no-unused-vars
    return false;
  }

  runAsMain() {
    
  }

  _loadPackage(isPackageRequired) {
    const path = npath.resolve(this.workDir, "package.json");
    try {
      return require(path);
    } catch (err) {
      if (isPackageRequired || err.code !== "MODULE_NOT_FOUND")
        throw err;
      return null;
    }
  }

  _loadConfig(configBaseName, isConfigRequired) {
    const exts = [".js", ".json"];
    for (let idx = 0; idx < exts.length; idx++) {
      const ext = exts[idx];
      const path = npath.join(this.workDir, configBaseName + ext);
      if (fs.existsSync(path))
        return require(path);
    }
    if (isConfigRequired)
      throw error(CONFIG_FILE_NOT_FOUND, {configBaseName});
  }

  _loadBuiltinPlugins(builtinPlugins) {
    this.plugins.load(builtinPlugins, __dirname);
  }

  _loadPlugins(autoLoadPlugins, configPropNames) {
    let plugins = configPropNames.plugins && this.config[configPropNames.plugins] || [];

    if (autoLoadPlugins === true) {
      if (!plugins.length)
        plugins = this._scanPlugins(autoLoadPlugins);
    } else if (autoLoadPlugins === "prepend") {
      plugins = this._scanPlugins(autoLoadPlugins).concat(plugins);
    } else if (autoLoadPlugins === "append") {
      plugins = plugins.concat(this._scanPlugins(autoLoadPlugins));
    }

    this.plugins.load(plugins, this.workDir);
  }

  _scanPlugins(autoLoadPlugins) {
    if (autoLoadPlugins && this.package) {
      const deps = Object.keys((this.package.dependencies || []).concat(this.package.devDependencies || []));
      return deps.filter(dep => this.isAutoLoadablePlugin(dep));
    }
    return [];
  }
}

module.exports = CliBase;
