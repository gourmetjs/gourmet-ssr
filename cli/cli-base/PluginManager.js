"use strict";

const npath = require("path");
const resolve = require("resolve");
const forEach = require("promise-box/lib/forEach");
const PluginResolver = require("@gourmet/resolve-plugins/PluginResolver");

class PluginManager {
  constructor({workDir}) {
    this._workDir = workDir;
    this._items = [];
  }

  // Recursively load the whole trees of plugins
  load(items, baseDir) {
    items.map(item => {
      if (typeof item === "string")
        return {name: item};
      return item;
    }).forEach(item => {
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
      this._items.push(item);
    });
  }

  runSync(eventName, ...args) {
    const handlers = this._getEventHandlers(eventName);
    for (let idx = 0; idx < handlers.length; idx++) {
      const handler = handlers[idx];
      const value = handler(...args);
      if (value !== undefined)
        return value;
    }
  }

  runAsync(eventName, ...args) {
    const handlers = this._getEventHandlers(eventName);
    return forEach(handlers, handler => {
      return handler(...args);
    });
  }

  runSeriesReduce(eventName, ...args) {

  }

  _loadPlugin(name, baseDir) {
    const path = resolve.sync(name, {basedir: baseDir || this._workDir});
    const klass = require(path);
    const dir = npath.dirname(path);
    return {dir, klass};
  }
}

module.exports = PluginManager;
