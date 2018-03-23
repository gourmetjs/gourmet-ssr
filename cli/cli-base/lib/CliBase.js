"use strict";

const npath = require("path");
const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");
const omit = require("lodash.omit");
const promiseMain = require("@gourmet/promise-main");
const promiseProtect = require("@gourmet/promise-protect");
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

  runCommand(args) {
    promiseMain(
      promiseProtect(() => {
        return this.init(args);
      }).then(() => {
        return this._applyCommandInfo();
      }).then(() => {
        const argv = this.context.argv;
        return Promise.resolve().then(() => {
          return this.context.plugins.runAsync("before:command:" + argv.$command, this.context);
        }).then(() => {
          return this.context.plugins.forEachAsync("command:" + argv.$command, handler => {
            return promiseProtect(() => {
              return handler(this.context);
            }).then(res => {
              // Returning `false` from the command handler means a pass-through.
              if (res !== false)
                return true;
            });
          }).then(consumed => {
            if (!consumed)
              throw error(COMMAND_NOT_HANDLED, {command: argv.$command});
          });
        }).then(() => {
          return this.context.plugins.runAsync("after:command:" + argv.$command, this.context);
        });
      })
    );
  }

  init(args) {
    const PluginManager = this._cliConfig.PluginManager;

    args = minimist(args);

    if (this._cliConfig.camelcaseArgs)
      args = camelcaseKeys(args);

    const argv = this._parseCommandArgs(args);
    const workDir = npath.resolve(process.cwd(), argv.$workDir);

    this.context = {
      cli: this,
      argv,
      workDir
    };

    this.context.plugins = new PluginManager(this.context);

    return promiseProtect(() => {
      return this.loadBuiltinPlugins();
    }).then(() => {
      return this.loadConfig();
    }).then(() => {
      return this.loadUserPlugins();
    });
  }

  loadBuiltinPlugins() {
    const plugins = this._cliConfig.builtinPlugins;
    this.context.plugins.load(plugins, __dirname);
  }

  loadConfig() {
  }

  loadUserPlugins() {    
  }

  _parseCommandArgs(args) {
    const argv = omit(args, ["_", this._cliConfig.workDirArgName]);
    const workDir = args[this._cliConfig.workDirArgName] || "";
    const command = args._.join(" ") || this._cliConfig.defaultCommand;

    // Make `argv.$command` & `argv.$workDir` invisible to regular enumeration.
    Object.defineProperty(argv, "$command", {value: command});
    Object.defineProperty(argv, "$workDir", {value: workDir});

    return argv;
  }

  _applyCommandInfo() {
    const argv = this.context.argv;
    const info = this._findCommandInfo(argv.$command);
    this._verifyCommandOptions(argv, info);
  }

  _findCommandInfo(command) {
    const plugins = this.context.plugins.toArray();
    for (let idx = 0; idx < plugins.length; idx++) {
      const {meta} = plugins[idx];
      if (meta && meta.commands && meta.commands[command])
        return meta.commands[command];
    }
    throw error(UNKNOWN_COMMAND, {command});
  }

  _verifyCommandOptions(argv, info) {
    if (!info.options)
      return;

    Object.keys(info.options).forEach(name => {
      const def = info.options[name];

      if (def.alias && argv[name] === undefined && argv[def.alias] !== undefined) {
        argv[name] = argv[def.alias];
        name = def.alias;
      }

      if (def.required && argv[name] === undefined)
        throw error(COMMAND_OPTION_REQUIRED, {name});

      if (def.default !== undefined && argv[name] === undefined)
        argv[name] = def.default;

      if (typeof def.coerce === "function")
        argv[name] = def.coerce(argv[name]);
    });
  }
}

module.exports = CliBase;
