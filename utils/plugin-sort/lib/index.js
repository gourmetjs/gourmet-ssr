"use strict";

const PluginSorter = require("./PluginSorter");

module.exports = function sortPlugins(items, options) {
  const sorter = new PluginSorter(options);
  return sorter.run(items);
};
