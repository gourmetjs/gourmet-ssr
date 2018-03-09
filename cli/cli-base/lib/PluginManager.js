"use strict";

const npath = require("path");
const resolve = require("resolve");
const omit = require("lodash.omit");
const repeat = require("promise-box/lib/repeat");
const merge = require("@gourmet/merge");
const sortPlugins = require("@gourmet/plugin-sort");

class PluginManager {
  constructor(cli) {
    this._cli = cli;
    this._plugins = [];
    this._events = null;
  }

  // Recursively load the whole trees of plugins
  load(items, baseDir) {
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
        return Object.assign(item);
      },

      // {name, plugin, meta, ...schema}
      finalize: item => {
        let pluginDir, PluginClass = item.plugin;

        if (typeof PluginClass !== "function") {
          const {dir, klass} = this._loadPlugin(item.plugin || item.name, baseDir);
          pluginDir = dir;
          PluginClass = klass;
        }

        const meta = PluginClass.meta || {};

        if (meta.subplugins)
          this.load(meta.subplugins, pluginDir || baseDir);

        merge(item, omit(meta.schema, "name"));

        const plugin = new PluginClass(item.options, this._cli);

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
      if (idx >= handlers.length)
        return null;
      const handler = handlers[idx++];
      return callback(handler);
    });
  }

  runAsync(eventName, ...args) {
    return this.forEachAsync(eventName, handler => handler(...args));
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
        const {meta, plugin} = items[idx];
        const handler = meta.hooks && meta.hooks[eventName];
        if (handler)
          handlers.push(handler.bind(plugin));
      }
      this._events[eventName] = handlers;
    }

    if (isReverse)
      handlers = [].concat(handlers).reverse();

    return handlers;
  }
}

module.exports = PluginManager;
