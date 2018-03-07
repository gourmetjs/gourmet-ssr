"use strict";

const npath = require("path");
const resolve = require("resolve");
const repeat = require("promise-box/lib/repeat");
const merge = require("@gourmet/config-merge");
const resolvePlugins = require("@gourmet/resolve-plugins");

class PluginManager {
  constructor({workDir}) {
    this._workDir = workDir;
    this._plugins = [];
    this._events = null;
  }

  // Recursively load the whole trees of plugins
  load(items, baseDir) {
    // Plugins are ordered in each batch (main `plugins` or each plugin's
    // `subplugins`) in loading phase.
    // Because all the plugins are re-ordered in event dispatch phase again,
    // The order of loading phase is less important.
    resolvePlugins({
      normalize(item) {
        if (typeof item === "string")
          return {name: item};
        return item;
      },
      finalize(item) {
        let pluginDir, PluginClass = item.plugin;
        if (typeof PluginClass !== "function") {
          const {dir, klass} = this._loadPlugin(item.plugin || item.name, baseDir);
          pluginDir = dir;
          PluginClass = klass;
        }
        item.plugin = new PluginClass(item.options);
        item.meta = item.plugin.meta || {};
        if (item.meta.subplugins)
          this.load(item.meta.subplugins, pluginDir);
        // {name, plugin, meta}
        this._plugins.push(item);
      }
    });
  }

  // The callback gets called with each handler.
  // If the callback returns non-undefined, the loop stops with the value as
  // a return value of the function.
  // If the loop reached to the end, `null` is returned instead.
  // If the event name begins with a caret as `"^after:command:deploy"`,
  // handers are iterated in reverse order.
  forEachSync(eventName, callback) {
    const handlers = this._getEventHandlers(eventName);
    for (let idx = 0; idx < handlers.length; idx++) {
      const value = callback(handlers[idx]);
      if (value !== undefined)
        return value;
    }
    return null;
  }

  // Each handler gets called in series. If a handler returns non-undefined,
  // the loop stops with the value as a return value of the function.
  // If the loop reached to the end, `null` is returned instead.
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
    return repeat(() => {
      if (idx++ >= handlers.length)
        return null;
      return callback(handlers[idx]);
    });
  }

  runAsync(eventName, ...args) {
    return this.forEachAsync(eventName, handler => handler(...args));
  }

  _loadPlugin(name, baseDir) {
    const path = resolve.sync(name, {basedir: baseDir || this._workDir});
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
      this._plugins = resolvePlugins(this._plugins);
      this._events = {};
    }

    let handlers = this._events[eventName];

    if (!handlers) {
      handlers = [];
      const plugins = this._plugins;
      for (let idx = 0; idx < plugins.length; idx++) {
        const meta = plugins[idx].meta;
        const handler = meta.hooks && meta.hooks[eventName];
        if (handler)
          handlers.push(handler.bind(meta.plugin));
      }
      this._events[eventName] = handlers;
    }

    if (isReverse)
      handlers = [].concat(handlers).reverse();

    return handlers;
  }
}

module.exports = PluginManager;
