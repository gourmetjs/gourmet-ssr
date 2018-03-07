"use strict";

const merge = require("@gourmet/merge");

class PluginSorter {
  constructor({
    // The normalizer should return an object with these standard fields:
    //  - name*, after, before, disable, options, virtual
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

    // Default order value to apply if an item doesn't have `order` field.
    // As an example, you can group plugins based on the stage of loading:
    //  - 1..4999: early plugins
    //  - 5000...99999: regular plugins
    //  - 100000+: late plugins
    defaultOrder=5000
  }={}) {
    this._normalize = normalize;
    this._finalize = finalize;
    this._schema = schema;
    this._defaultOrder = defaultOrder;
  }

  // Returns a copied array of plugins, which are normalized, sorted and finalized.
  // If an item's `virtual` field is truthy, it has the same effect as the
  // schema, and excluded from the finalized result array.
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

      if (typeof item.name !== "string")
        throw Error("Name is required");

      if (item.name === "*" || item.disable || item.virtual)
        virtual[item.name] = merge.intact(virtual[item.name], item);
      else
        plugins.push(item);
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

  // Sort items based on the `order` field.
  _sortItems(items) {
    const co = this._getConstraintOrders(items);
    const list = items.map((item, idx) => [item, co[idx], idx]);

    list.sort((a, b) => {
      const ac = a[1];
      const bc = b[1];

      // first key: constraint order (generated from `after` & `before`)
      if (ac !== bc)
        return ac - bc;

      // second key: `order` field
      const ao = a[0].order || this._defaultOrder;
      const bo = b[0].order || this._defaultOrder;

      if (ao !== bo)
        return ao - bo;

      // final key: original index to make the sort stable
      return a[2] - b[2];
    });

    return list.map(info => info[0]);
  }

  _getConstraintOrders(items) {
    // lowIndices = {"name": idx, ...}  // lowest index of the named plugin
    // highIndices = {"name": idx, ...}  // highest index of the named plugin
    const lowIndices = {};
    const highIndices = {};

    // after = [["a", "b"], [], ...]  // copy of `after` field of a plugin at the index
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
      if (co[idx] !== undefined)
        return co[idx] || 1;

      const af = after[idx];

      if (af.length) {
        let max;
        co[idx] = null;   // flag to prevent the infinite circular reference
        af.forEach(target => {
          if (highIndices[target] !== undefined) {
            const val = _init(highIndices[target]);
            if (!max || val > max)
              max = val;
          }
        });
        return co[idx] = (max || 0) + 1;
      } else {
        return co[idx] = 1;
      }
    }

    const co = [];

    items.forEach((item, idx) => {
      _init(idx);
    });

    return co;
  }

  _finalizeItems(items) {
    return items.map(item => this._finalize(item)).filter(item => !!item);
  }
}

module.exports = PluginSorter;
