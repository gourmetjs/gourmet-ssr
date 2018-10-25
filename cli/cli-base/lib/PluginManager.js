"use strict";

const npath = require("path");
const resolve = require("resolve");
const omit = require("@gourmet/omit");
const promiseRepeat = require("@gourmet/promise-repeat");
const promiseSync = require("@gourmet/promise-sync");
const merge = require("@gourmet/merge");
const error = require("@gourmet/error");
const sortPlugins = require("@gourmet/plugin-sort");

const INVALID_EXPORTED_PLUGIN = {
  message: "Plugin '${name}' must export a class.",
  code: "INVALID_EXPORTED_PLUGIN"
};

const INVALID_PLUGIN_VALUE = {
  message: "Plugin '${name}' has invalid value in 'plugin'. It must be a string or class.",
  code: "INVALID_PLUGIN_VALUE"
};

const INVALID_HANDLER_VALUE = {
  message: "Plugin '${name}' has invalid value in 'meta.hooks[\"${eventName}\"]'. It must be a function.",
  code: "INVALID_HANDLER_VALUE"
};

class PluginManager {
  constructor(context) {
    this._context = context;
    this._plugins = [];
    this._events = null;
  }

  // Recursively load the whole trees of plugins
  load(items, baseDir, parent, indent=0) {
    const con = this._context.console;

    const prefix = !parent ? "=>" : `${parent} =>`;
    const plugins = items.map(item => typeof item === "string" ? item : item.name);
    con.print({level: "debug", indent: (indent + 1) * 2}, prefix, plugins);

    // Plugins are ordered in each batch (main `plugins` or each plugin's
    // `subplugins`) in loading phase.
    // Because all the plugins are re-ordered in event dispatch phase again,
    // The order of loading phase is less important.
    sortPlugins(items, {
      // name: programmatic ID
      // plugin: module path string or plugin instance object
      normalize(item) {
        if (typeof item === "string")
          return {name: item};
        return item;
      },

      // {...schema, name, plugin, meta}
      finalize: item => {
        let pluginDir, PluginClass;

        if (typeof item.plugin === "string" || item.plugin === undefined) {
          const {dir, klass} = this._loadPlugin(item.plugin || item.name, baseDir);
          if (typeof klass !== "function")
            throw error(INVALID_EXPORTED_PLUGIN, {name: item.name});
          pluginDir = dir;
          PluginClass = klass;
        } else if (typeof item.plugin === "function") {
          PluginClass = item.plugin;
        } else {
          throw error(INVALID_PLUGIN_VALUE, {name: item.name});
        }

        const meta = PluginClass.meta || {};

        if (meta.subplugins)
          this.load(meta.subplugins, pluginDir || baseDir, item.name, indent + 1);

        item = merge(omit(meta.schema, "name") || {}, item);

        const plugin = new PluginClass(item.options, this._context);

        item.meta = meta;
        item.plugin = plugin;

        this._plugins.push(item);
      }
    });
  }

  // The callback gets called with each handler.
  // If the callback returns non-undefined, the loop stops with the value as
  // a return value of the function.
  // If the loop reached to the end, `null` is returned instead.
  // If the event name begins with a caret as `"^after:command:deploy"`,
  // handlers are iterated in reverse order.
  forEachSync(eventName, callback) {
    const handlers = this._getEventHandlers(eventName);
    for (let idx = 0; idx < handlers.length; idx++) {
      const value = callback(handlers[idx]);
      if (value !== undefined)
        return value;
    }
  }

  // Each handler gets called in series. If a handler returns non-undefined,
  // the loop stops with the value as a return value of the function.
  // If the loop reached to the end, `undefined` is returned instead.
  runSync(eventName, ...args) {
    return this.forEachSync(eventName, handler => handler(...args));
  }

  // Each handler gets called in series, with the result of previous handler's
  // return value as a first argument.
  // The final value is returned.
  runWaterfallSync(eventName, value, ...args) {
    this.forEachSync(eventName, handler => {
      value = handler(value, ...args);
    });
    return value;
  }

  // Each handler gets called in series and the return value of the handler is
  // merged into `obj` in-place.
  // `obj` is returned.
  runMergeSync(eventName, obj={}, ...args) {
    this.forEachSync(eventName, handler => {
      const value = handler(...args);
      if (value)
        merge(obj, value);
    });
    return obj;
  }

  forEachAsync(eventName, callback) {
    const handlers = this._getEventHandlers(eventName);
    let idx = 0;
    return promiseRepeat(() => {
      if (idx >= handlers.length)
        return promiseRepeat.UNDEFINED;
      const handler = handlers[idx++];
      return callback(handler);
    });
  }

  runAsync(eventName, ...args) {
    return this.forEachAsync(eventName, handler => handler(...args));
  }

  runMergeAsync(eventName, obj={}, ...args) {
    return this.forEachAsync(eventName, handler => {
      const value = handler(...args);
      return promiseSync(value, value => {
        if (value)
          merge(obj, value);
      });
    }).then(() => obj);
  }

  toArray() {
    return [].concat(this._plugins);
  }

  _loadPlugin(name, baseDir) {
    const path = resolve.sync(name, {basedir: baseDir});
    const klass = require(path);
    const dir = npath.dirname(path);
    return {dir, klass};
  }

  _getEventHandlers(eventName) {
    let isReverse = false;

    if (eventName[0] === "^") {
      eventName = eventName.substr(1);
      isReverse = true;
    }

    if (!this._events) {
      // Re-order the plugins as a whole array to mix all the batches.
      this._plugins = sortPlugins(this._plugins);
      this._events = {};
    }

    let handlers = this._events[eventName];

    if (!handlers) {
      handlers = [];
      const items = this._plugins;
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const hooks = item.meta.hooks;
        if (hooks && hooks[eventName]) {
          const handler = hooks[eventName];
          if (typeof handler !== "function")
            throw error(INVALID_HANDLER_VALUE, {name: item.name, eventName});
          handlers.push(handler.bind(item.plugin));
        }
      }
      this._events[eventName] = handlers;
    }

    if (isReverse)
      handlers = [].concat(handlers).reverse();

    return handlers;
  }
}

module.exports = PluginManager;
