"use strict";

const npath = require("path");
const fs = require("fs");
const os = require("os");
const minimist = require("minimist");
const camelcaseKeys = require("camelcase-keys");
const con = require("@gourmet/console")();
const promiseMain = require("@gourmet/promise-main");
const promiseProtect = require("@gourmet/promise-protect");
const error = require("@gourmet/error");
const HandledError = require("@gourmet/error/HandledError");
const PluginManager = require("./PluginManager");

const COMMAND_OPTION_REQUIRED = {
  message: "`Option '--${name}' is required`",
  code: "COMMAND_OPTION_REQUIRED"
};

const COMMAND_NOT_HANDLED = {
  message: "Command '${command}' was not handled by any plugin. Maybe a bug?",
  code: "COMMAND_NOT_HANDLED"
};

class CliBase {
  constructor(options) {
    this.options = Object.assign({
      builtinPlugins: [],
      execName: "cli"
    }, options);
  }

  runCommand(argv) {
    return promiseProtect(() => {
      return this.init(argv);
    }).then(() => {
      const context = this.context;
      if (!this.showHelp()) {
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
      } else {
        return context;
      }
    });
  }

  main(argv) {
    promiseMain(
      this.runCommand(argv).catch(err => {
        if (err instanceof HandledError) {
          const _con = (this.context && this.context.console) || con;
          _con.error(_con.colors.brightRed(">>>"));
          _con.error(_con.colors.brightRed(">>> " + err.message));
          _con.error(_con.colors.brightRed(">>>"));
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
    return argv._.join(" ");
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
      console: con
    };

    this.context.plugins = new PluginManager(this.context);

    this.loadBuiltinPlugins();
  }

  loadBuiltinPlugins() {
    const plugins = this.options.builtinPlugins;
    if (plugins.length) {
      this.context.console.debug("Loading builtin plugins...");
      this.context.plugins.load(plugins, __dirname);
    }
  }

  findPluginByCommand(command) {
    const plugins = this.context.plugins.toArray();
    for (let idx = 0; idx < plugins.length; idx++) {
      const {meta} = plugins[idx];
      if (meta && meta.commands && meta.commands[command])
        return plugins[idx];
    }
    console.error("Unknown command: " + command);
    process.exit(1);
  }

  findCommandInfo(command) {
    return this.findPluginByCommand(command).meta.commands[command];
  }

  verifyArgs() {
    const info = this.findCommandInfo(this.context.command);

    if (info.options) {
      Object.keys(info.options).forEach(name => {
        const def = info.options[name];
        if (def.required && this.context.argv[name] === undefined)
          throw error(COMMAND_OPTION_REQUIRED, {name});
      });
    }

    return info;
  }

  showHelp() {
    const {command, argv} = this.context;

    if (argv.showPlugins || argv.showPluginsDetails) {
      // `cli --show-plugins`
      this.showPlugins(argv.showPluginsDetails);
    } else if (!command && argv.version === true) {
      // `cli --version`
      this.showVersionHelp();
    } else if ((command && argv.version) || (!command && typeof argv.version === "string")) {
      // `cli command --version` or `cli --version command`
      this.showVersionHelp(command || argv.version);
    } else if (!command && (argv.help === undefined || argv.help === true || argv.h === true)) {
      // `cli` or `cli --help` or `cli -h`
      this.showMainHelp();
    } else if (command && (argv.help || argv.h)) {
      // `cli command --help` or `cli command -h`
      this.showCommandHelp(command);
    } else if (!command && (typeof argv.help === "string" || typeof argv.h === "string")) {
      // `cli --help command` or `cli -h command`
      this.showCommandHelp(argv.help || argv.h);
    } else {
      return false;
    }

    return true;
  }

  showMainHelp() {
    const WIDTH = 11;
    const items = [];

    this.context.plugins.toArray().forEach(({meta}) => {
      if (meta && meta.commands) {
        Object.keys(meta.commands).forEach(command => {
          const info = meta.commands[command];
          items.push("  " + command + " ".repeat(Math.max(WIDTH - command.length - 2, 2)) + (info.description || ""));
        });
      }
    });

    con.log([
      `Usage: ${this.options.execName} <command> [options]`,
      "",
      "To see help, run:",
      `  ${this.options.execName} --help`,
      `  ${this.options.execName} <command> --help`
    ].join("\n"));

    if (items.length) {
      con.log([
        "",
        `Available command${items.length > 1 ? "s" : ""}:`
      ].concat(items).join("\n"));
    }
  }

  showCommandHelp(command) {
    const info = this.findCommandInfo(command);

    con.log([
      info.description ? info.description + "\n\n" : "",
      `Usage: ${this.options.execName} ${command} [options]\n`,
      info.help ? "\nOptions:\n" + info.help : ""
    ].join(""));
  }

  showVersionHelp(command) {
    if (this.options.execPackage) {
      const pkg = this._loadJson(this.options.execPackage);
      if (pkg)
        con.log(pkg.name, `${pkg.version}`);
    }

    if (command) {
      const item = this.findPluginByCommand(command);
      const {pkg} = this._findPackageJson(item.name, item.path);
      if (pkg && pkg.name && pkg.version)
        con.log(`${pkg.name} ${pkg.version} (${command} command)`);
    }

    con.log("node", process.version);
    con.log(os.platform(), os.release());
  }

  showPlugins(details) {
    function _show(label, data) {
      if (!data)
        return;

      if (Array.isArray(data)) {
        if (!data.length)
          return;
        data = data.join(", ");
      }

      con.log("  " + label + " ".repeat(Math.max(WIDTH - label.length - 2, 1)) + data);
    }

    const WIDTH = 11;
    const plugins = this.context.plugins.toArray();

    if (this.options.execPackage) {
      const pkg = this._loadJson(this.options.execPackage);
      if (pkg) {
        con.log(pkg.name, `(${pkg.version})`);
        if (details)
          _show("path", this.options.execPackage);
      }
    }

    plugins.forEach(item => {
      const {name, meta} = item;
      const {path, pkg} = this._findPackageJson(item.name, item.path);
      con.log(name, pkg && pkg.version ? `(${pkg.version})` : "");
      if (details) {
        _show("path", path || item.path);
        _show("before", item.before);
        _show("after", item.after);
        _show("commands", Object.keys((meta && meta.commands) || {}));
        _show("hooks", Object.keys((meta && meta.hooks) || {}));
      }
    });
  }

  _findPackageJson(name, path) {
    if (path) {
      let prev = path;
      for (;;) {
        const dir = npath.dirname(prev);
        if (dir === prev)
          break;
        const path = npath.join(dir, "package.json");
        const pkg = this._loadJson(path);
        if (pkg && pkg.name === name)
          return {path, pkg};
        prev = dir;
      }
    }
    return {};
  }

  _loadJson(path) {
    try {
      const content = fs.readFileSync(path, "utf8");
      return JSON.parse(content);
    } catch (err) {
      return null;
    }
  }
}

module.exports = CliBase;
