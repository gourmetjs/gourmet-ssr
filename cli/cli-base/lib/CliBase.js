"use strict";

const npath = require("path");
const fs = require("fs");
const minimist = require("minimist");
const omit = require("lodash.omit");
const runAsMain = require("promise-box/lib/runAsMain");
const wrap = require("promise-box/lib/wrap");
const error = require("@gourmet/error");
const merge = require("@gourmet/merge");
const PluginManager = require("./PluginManager");
const PluginBuiltinHelp = require("./PluginBuiltinHelp");

const CONFIG_FILE_NOT_FOUND = {
  message: "Config file '${baseName}.js' or '${baseName}.json' not found in directory '${workDir}'",
  code: "CONFIG_FILE_NOT_FOUND"
};

const COMMAND_OPTION_REQUIRED = {
  message: "`Option '--${name}' is required`",
  code: "COMMAND_OPTION_REQUIRED"
};

const UNKNOWN_COMMAND = {
  message: "Unknown command: ${command}",
  code: "UNKNOWN_COMMAND"
};

class CliBase {
  constructor(cliConfig={}) {
    this._cliConfig = merge({
      workDirArgName: "dir",
      configBaseName: "cli",
      builtinPlugins: [{
        name: PluginBuiltinHelp.meta.name,
        plugin: PluginBuiltinHelp
      }],
      isPackageRequired: false,
      isConfigRequired: true,
      autoLoadPlugins: "prepend",    // false | true | "prepend" | "append"
      defaultCommand: "help",
      configPropNames: {
        plugins: "plugins",
        autoLoadPlugins: "autoLoadPlugins"
      },
      PluginManager
    }, cliConfig);
  }

  // Override and return `true` if the dependency is an auto-loadable plugin
  isAutoLoadablePlugin(moduleName) {   // eslint-disable-line no-unused-vars
    return false;
  }

  runCommand(argv) {
    runAsMain(
      wrap(() => {
        argv = minimist(argv);
        this._init(argv[this._cliConfig.workDirArgName]);
        return this._parseCommandArgs(argv);
      }).then(options => {
        return Promise.resolve().then(() => {
          return this.plugins.runAsync("before:command:" + options.$command, options);
        }).then(() => {
          return this.plugins.runAsync("command:" + options.$command, options);
        }).then(() => {
          return this.plugins.runAsync("after:command:" + options.$command, options);
        });
      })
    );
  }

  _init(workDir="") {
    const clicfg = this._cliConfig;
    const PluginManager = clicfg.PluginManager;

    this.workDir = npath.resolve(process.cwd(), workDir);
    this.package = this._loadModule(npath.join(this.workDir, "package.json"), clicfg.isPackageRequired);

    this._config = this._loadConfig();

    this.plugins = new PluginManager(this);

    this._loadBuiltinPlugins();
    this._loadUserPlugins();
  }

  _loadModule(path, required) {
    try {
      return require(path);
    } catch (err) {
      if (required || err.code !== "MODULE_NOT_FOUND")
        throw err;
      return null;
    }
  }

  _loadConfig() {
    const baseName = this._cliConfig.configBaseName;
    const required = this._cliConfig.isConfigRequired;
    const exts = [".js", ".json"];

    for (let idx = 0; idx < exts.length; idx++) {
      const ext = exts[idx];
      const path = npath.join(this.workDir, baseName + ext);
      if (fs.existsSync(path))
        return require(path);
    }

    if (required)
      throw error(CONFIG_FILE_NOT_FOUND, {baseName, workDir: this.workDir});
  }

  _loadBuiltinPlugins() {
    const plugins = this._cliConfig.builtinPlugins;
    this.plugins.load(plugins, __dirname);
  }

  _loadUserPlugins() {
    const auto = this._cliConfig.autoLoadPlugins;
    const names = this._cliConfig.configPropNames;

    let plugins = this._config[names.plugins] || [];

    if (auto === true) {
      if (!plugins.length)
        plugins = this._scanPlugins(auto);
    } else if (auto === "prepend") {
      plugins = this._scanPlugins(auto).concat(plugins);
    } else if (auto === "append") {
      plugins = plugins.concat(this._scanPlugins(auto));
    }

    this.plugins.load(plugins, this.workDir);
  }

  _scanPlugins(auto) {
    if (auto && this.package) {
      const deps = Object.assign({}, this.package.dependencies, this.package.devDependencies);
      return Object.keys(deps).filter(dep => this.isAutoLoadablePlugin(dep));
    }
    return [];
  }

  _parseCommandArgs(argv) {
    const options = omit(argv, "_");
    let command = argv._.join(" ");

    if (!command)
      command = this._cliConfig.defaultCommand;

    // Make `options.$command` invisible to regular enumeration.
    Object.defineProperty(options, "$command", {value: command});

    const info = this._findCommandInfo(options.$command);

    this._verifyCommandOptions(options, info);

    return options;
  }

  _findCommandInfo(command) {
    const plugins = this.plugins.toArray();
    for (let idx = 0; idx < plugins.length; idx++) {
      const {meta} = plugins[idx];
      if (meta && meta.commands && meta.commands[command])
        return meta.commands[command];
    }
    throw error(UNKNOWN_COMMAND, {command});
  }

  _verifyCommandOptions(options, info) {
    if (!info.options)
      return;

    Object.keys(info.options).forEach(name => {
      const def = info.options[name];

      if (def.alias && options[name] === undefined && options[def.alias] !== undefined) {
        options[name] = options[def.alias];
        name = def.alias;
      }

      if (def.required && options[name] === undefined)
        throw error(COMMAND_OPTION_REQUIRED, {name});

      if (def.default && options[name] === undefined)
        options[name] = def.default;
    });
  }
}

module.exports = CliBase;
