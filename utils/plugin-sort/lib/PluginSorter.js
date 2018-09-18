"use strict";

const merge = require("@gourmet/merge");
const isPlainObject = require("@gourmet/is-plain-object");

// Scale of multiplication for calculating base orders.
// This number means the maximum number of references that an item can have
// (i.e. source of `after`) without side-effect.
// 1000 seems to be way more than enough.
const CONSTRAINT_SCALE = 1000;

class PluginSorter {
  constructor({
    // The normalizer should return an object with these standard fields:
    //  - name*, group, after, before, disable, options, virtual
    // Other non-standard fields will be kept intact.
    normalize=(item => item),

    // The finalizer should return a value that the final consumer of plugins
    // expects. The item is excluded if `undefined` is returned.
    finalize=(item => item),

    // Base schema of the plugins indexed by a name.
    // The object value of the matching name will be applied to the named plugin.
    // You can use '*' to apply to all plugins.
    // e.g. {"plugin-1": {before: "plugin-2"}, "*": {loose: true}}
    schema={},

    // Default group value to apply if an item doesn't have `group` field.
    // As an example, you can group plugins based on the stage of loading:
    //  - 1..199: early plugins / recommended = 100
    //  - 200...799: regular plugins / recommended = 500
    //  - 800..999: late plugins / recommended = 900
    defaultGroup=500
  }={}) {
    this._normalize = normalize;
    this._finalize = finalize;
    this._schema = schema;
    this._defaultGroup = defaultGroup;
  }

  // Returns a copied array of plugins, which are normalized, sorted and finalized.
  // If an item's name starts with '#', it has the same effect as the schema,
  // and excluded from the finalized result array.
  run(items) {
    if (!Array.isArray(items))
      throw Error("Items must be an array");

    items = this._prepareItems(items);
    items = this._sortItems(items);

    return this._finalizeItems(items);
  }

  // Normalizes, applies schema to, and filters items.
  _prepareItems(items) {
    const virtual = {};
    const plugins = [];

    for (let idx = 0; idx < items.length; idx++) {
      const item = this._normalize(items[idx]);

      if (!isPlainObject(item))
        throw Error("'normalize' should return an object");

      if (typeof item.name !== "string")
        throw Error("Name is required");

      if (item.name[0] === "#") {
        const name = item.name.substr(1);
        virtual[name] = merge(virtual[name] || {}, item, {name});
      } else {
        plugins.push(item);
      }
    }

    return this._applySchema(plugins, virtual);
  }

  _applySchema(items, virtual) {
    const schema = this._schema;
    const s = schema["*"];
    const v = virtual["*"];
    const plugins = [];

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const name = item.name;
      const res = merge({after:[], before:[]}, s, v, schema[name], virtual[name], item);
      if (!res.disable)
        plugins.push(res);
    }

    return plugins;
  }

  // Sort items based on the `group` field, constraints(`before`, `after`)
  // and original position.
  _sortItems(items) {
    const orders = this._getConstraintOrders(items);
    const list = items.map((item, idx) => [item, orders[idx], idx]);

    list.sort((a, b) => {
      const ag = a[0].group || this._defaultGroup;
      const bg = b[0].group || this._defaultGroup;

      if (ag !== bg)
        return ag - bg;

      if (a[1] !== b[1])
        return a[1] - b[1];

      return a[2] - b[2];
    });

    return list.map(info => info[0]);
  }

  // Gets a table of numbers that represents the order of items based on
  // their constraints while preserving their original locations as much as
  // possible.
  _getConstraintOrders(items) {
    // lowIndices = {"name": idx, ...}  // lowest index of the named plugin
    // highIndices = {"name": idx, ...}  // highest index of the named plugin
    const lowIndices = {};
    const highIndices = {};

    // [["a", "b"], [], ...]: copy of `after` field of a plugin at the index
    const after = items.map((item, idx) => {
      const name = item.name;
      if (lowIndices[name] === undefined)
        lowIndices[name] = idx;
      if (highIndices[name] === undefined || idx > highIndices[name])
        highIndices[name] = idx;
      return item.after;
    });

    // Convert `before` to `after` 
    items.forEach(item => {
      item.before.forEach(target => {
        const idx = lowIndices[target];
        if (idx !== undefined)
          after[idx].push(item.name);
      });
    });

    function _init(idx) {
      if (orders[idx])
        return orders[idx];

      const af = after[idx];

      if (af.length) {
        let max;
        // We keep updating `orders[idx]` to give the best estimation and
        // the prevention of infinite circular reference.
        orders[idx] = idx * CONSTRAINT_SCALE;
        af.forEach(target => {
          if (highIndices[target] !== undefined) {
            const val = _init(highIndices[target]);
            if (!max || val > max) {
              max = val;
              orders[idx] = max + 1;
            }
          }
        });
        return orders[idx] = max ? (max + 1) : idx * CONSTRAINT_SCALE;
      } else {
        return orders[idx] = idx * CONSTRAINT_SCALE;
      }
    }

    const orders = [];

    items.forEach((item, idx) => {
      _init(idx);
    });

    return orders;
  }

  _finalizeItems(items) {
    return items.map(item => this._finalize(item)).filter(item => item !== undefined);
  }
}

module.exports = PluginSorter;
