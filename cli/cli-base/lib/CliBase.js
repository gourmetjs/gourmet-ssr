"use strict";

const npath = require("path");
const minimist = require("minimist");
const omit = require("lodash.omit");
const runAsMain = require("promise-box/lib/runAsMain");
const wrap = require("promise-box/lib/wrap");
const error = require("@gourmet/error");
const merge = require("@gourmet/merge");
const PluginManager = require("./PluginManager");
const PluginBuiltinHelp = require("./PluginBuiltinHelp");

const COMMAND_OPTION_REQUIRED = {
  message: "`Option '--${name}' is required`",
  code: "COMMAND_OPTION_REQUIRED"
};

const UNKNOWN_COMMAND = {
  message: "Unknown command: ${command}",
  code: "UNKNOWN_COMMAND"
};

const COMMAND_NOT_HANDLED = {
  message: "Command '${command}' was not handled by any plugin. Maybe a bug?",
  code: "COMMAND_NOT_HANDLED"
};

class CliBase {
  constructor(cliConfig={}) {
    this._cliConfig = merge({
      workDirArgName: "dir",
      builtinPlugins: [{
        name: PluginBuiltinHelp.meta.name,
        plugin: PluginBuiltinHelp
      }],
      defaultCommand: "help",
      PluginManager
    }, cliConfig);
  }

  runCommand(argv) {
    runAsMain(
      wrap(() => {
        return this.init(argv);
      }).then(() => {
        return this._applyCommandInfo();
      }).then(() => {
        const options = this.options;
        return Promise.resolve().then(() => {
          return this.plugins.runAsync("before:command:" + options.$command, options, this);
        }).then(() => {
          return this.plugins.forEachAsync("command:" + options.$command, handler => {
            return wrap(() => {
              return handler(options, this);
            }).then(res => {
              // Returning `false` from the command handler means a pass-through.
              if (res !== false)
                return true;
            });
          }).then(consumed => {
            if (!consumed)
              throw error(COMMAND_NOT_HANDLED, {command: options.$command});
          });
        }).then(() => {
          return this.plugins.runAsync("after:command:" + options.$command, options, this);
        });
      })
    );
  }

  init(argv) {
    const PluginManager = this._cliConfig.PluginManager;

    argv = minimist(argv);

    this.options = this._parseCommandArgs(argv);
    this.workDir = npath.resolve(process.cwd(), this.options.$workDir);
    this.plugins = new PluginManager(this);

    return wrap(() => {
      return this.loadBuiltinPlugins();
    }).then(() => {
      return this.loadConfig();
    }).then(() => {
      return this.loadUserPlugins();
    });
  }

  loadBuiltinPlugins() {
    const plugins = this._cliConfig.builtinPlugins;
    this.plugins.load(plugins, __dirname);
  }

  loadConfig() {
  }

  loadUserPlugins() {    
  }

  _parseCommandArgs(argv) {
    const options = omit(argv, ["_", this._cliConfig.workDirArgName]);
    const workDir = argv[this._cliConfig.workDirArgName] || "";
    const command = argv._.join(" ") || this._cliConfig.defaultCommand;

    // Make `options.$command` & `options.$workDir` invisible to regular enumeration.
    Object.defineProperty(options, "$command", {value: command});
    Object.defineProperty(options, "$workDir", {value: workDir});

    return options;
  }

  _applyCommandInfo() {
    const options = this.options;
    const info = this._findCommandInfo(options.$command);
    this._verifyCommandOptions(options, info);
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

      if (def.default !== undefined && options[name] === undefined)
        options[name] = def.default;
    });
  }
}

module.exports = CliBase;
