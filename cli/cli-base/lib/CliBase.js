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
  constructor({
    builtinPlugins=[{
      name: PluginBuiltinHelp.meta.name,
      plugin: PluginBuiltinHelp
    }],
    defaultCommand="help"
  }={}) {
    this.builtinPlugins = builtinPlugins;
    this.defaultCommand = defaultCommand;
  }

  runCommand(argv) {
    promiseMain(
      promiseProtect(() => {
        return this.init(argv);
      }).then(() => {
        const context = this.context;
        this.verifyArgs(argv, this.findCommandInfo(argv.command));
        context.console.info("Running command with argv:", argv);
        return context.plugins.runAsync("before:command:" + argv.command, context).then(() => {
          return context.plugins.forEachAsync("command:" + argv.command, handler => {
            return promiseProtect(() => {
              return handler(context);
            }).then(res => {
              // Returning `false` from the command handler means a pass-through.
              if (res !== false)
                return true;
            });
          }).then(consumed => {
            if (!consumed)
              throw error(COMMAND_NOT_HANDLED, {command: argv.command});
          });
        }).then(() => {
          return context.plugins.runAsync("after:command:" + argv.command, context);
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

  parseArgs(args) {
    const argv = camelcaseKeys(minimist(args));
    return Object.assign({
      command: argv._.join(" ") || this.defaultCommand,
      workDir: argv.dir || argv.d || ""
    }, omit(argv, ["_", "dir", "d"]));
  }

  init(argv) {
    installMemConsole({
      useColors: argv.colors,
      minLevel: (6 - parseInt(argv.verbose || argv.v, 10)) || undefined
    });

    this.context = {
      cli: this,
      argv,
      workDir: npath.resolve(process.cwd(), argv.workDir),
      console: getConsole("gourmet:cli")
    };

    this.context.plugins = new PluginManager(this.context);

    return this.loadBuiltinPlugins();
  }

  loadBuiltinPlugins() {
    const plugins = this.builtinPlugins;
    if (plugins.length) {
      this.context.console.info("Loading builtin plugins...");
      this.context.plugins.load(plugins, __dirname);
    }
  }

  findCommandInfo(command) {
    const plugins = this.context.plugins.toArray();
    for (let idx = 0; idx < plugins.length; idx++) {
      const {meta} = plugins[idx];
      if (meta && meta.commands && meta.commands[command])
        return meta.commands[command];
    }
    throw error(UNKNOWN_COMMAND, {command});
  }

  verifyArgs(argv, info) {
    if (info.options) {
      Object.keys(info.options).forEach(name => {
        const def = info.options[name];
        if (def.required && argv[name] === undefined)
          throw error(COMMAND_OPTION_REQUIRED, {name});
      });
    }
  }
}

module.exports = CliBase;
