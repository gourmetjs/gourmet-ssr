"use strict";

const npath = require("path");
const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");
const omit = require("lodash.omit");
const getConsole = require("@gourmet/console");
const installMemConsole = require("@gourmet/console-mem");
const promiseMain = require("@gourmet/promise-main");
const promiseProtect = require("@gourmet/promise-protect");
const error = require("@gourmet/error");
const HandledError = require("@gourmet/error/lib/HandledError");
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
      camelcaseArgs: true,
      workDirArgNames: ["dir", "d"],
      colorsArgNames: ["colors"],
      verbosityArgNames: ["verbose", "v"],
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
        this.context.console.info("Running command with argv:", Object.assign({$command: argv.$command, $workDir: argv.$workDir}, argv));
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
      }).catch(err => {
        if (err instanceof HandledError) {
          const con = (this.context && this.context.console) || getConsole("gourmet:cli");
          con.error(con.colors.brightRed(">>>"));
          con.error(con.colors.brightRed(">>> " + err.message));
          con.error(con.colors.brightRed(">>>"));
          process.exitCode = err.exitCode || 2;
        } else {
          throw err;
        }
      })
    );
  }

  init(args) {
    function _verbosityToLevel(v) {
      return (6 - parseInt(v, 10)) || undefined;
    }

    const cfg = this._cliConfig;
    const PluginManager = cfg.PluginManager;

    args = minimist(args);

    if (cfg.camelcaseArgs)
      args = camelcaseKeys(args);

    installMemConsole({
      useColors: this._findCommandArg(args, cfg.colorsArgNames),
      minLevel: _verbosityToLevel(this._findCommandArg(args, cfg.verbosityArgNames))
    });

    const argv = this._parseCommandArgs(args);
    const workDir = npath.resolve(process.cwd(), argv.$workDir);

    this.context = {
      cli: this,
      argv,
      workDir,
      console: getConsole("gourmet:cli")
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
    if (plugins.length)
      this.context.console.info("Loading builtin plugins...");
    this.context.plugins.load(plugins, __dirname);
  }

  loadConfig() {
  }

  loadUserPlugins() {
  }

  _findCommandArg(args, names) {
    for (let idx = 0; idx < names.length; idx++) {
      const name = names[idx];
      if (args[name])
        return args[name];
    }
  }

  _parseCommandArgs(args) {
    const cfg = this._cliConfig;
    const argv = omit(args, ["_"].concat(cfg.workDirArgNames).concat(cfg.colorsArgNames).concat(cfg.verbosityArgNames));
    const workDir = this._findCommandArg(args, cfg.workDirArgNames) || "";
    const command = args._.join(" ") || cfg.defaultCommand;

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
