"use strict";

const npath = require("path");
const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");
const getConsole = require("@gourmet/console");
const promiseMain = require("@gourmet/promise-main");
const promiseProtect = require("@gourmet/promise-protect");
const error = require("@gourmet/error");
const HandledError = require("@gourmet/error/HandledError");
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
    return promiseProtect(() => {
      return this.init(argv);
    }).then(() => {
      const context = this.context;
      this.verifyArgs();
      context.console.info("Running command with argv:", argv);
      return context.plugins.runAsync("before:command:" + context.command, context).then(() => {
        return context.plugins.forEachAsync("command:" + context.command, handler => {
          return promiseProtect(() => {
            return handler(context);
          }).then(res => {
            // Returning `false` from the command handler means a pass-through.
            if (res !== false)
              return true;
          });
        }).then(consumed => {
          if (!consumed)
            throw error(COMMAND_NOT_HANDLED, {command: context.command});
        });
      }).then(() => {
        return context.plugins.runAsync("after:command:" + context.command, context);
      }).then(() => {
        return context;
      });
    });
  }

  main(argv) {
    promiseMain(
      this.runCommand(argv).catch(err => {
        if (err instanceof HandledError) {
          const con = (this.context && this.context.console) || getConsole();
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
    return camelcaseKeys(minimist(args));
  }

  getCommand(argv) {
    return argv._.join(" ") || this.defaultCommand;
  }

  getWorkDir(argv) {
    return npath.resolve(process.cwd(), argv.workDir || argv.dir || argv.d || "");
  }

  init(argv) {
    this.context = {
      cli: this,
      argv,
      command: this.getCommand(argv),
      workDir: this.getWorkDir(argv),
      console: getConsole()
    };

    this.context.plugins = new PluginManager(this.context);

    return this.loadBuiltinPlugins();
  }

  loadBuiltinPlugins() {
    const plugins = this.builtinPlugins;
    if (plugins.length) {
      this.context.console.debug("Loading builtin plugins...");
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
  }

  verifyArgs() {
    const info = this.findCommandInfo(this.context.command);

    if (!info)
      throw error(UNKNOWN_COMMAND, {command: this.context.command});

    if (info.options) {
      Object.keys(info.options).forEach(name => {
        const def = info.options[name];
        if (def.required && this.context.argv[name] === undefined)
          throw error(COMMAND_OPTION_REQUIRED, {name});
      });
    }

    return info;
  }
}

module.exports = CliBase;
