"use strict";

const loadables = {};

function add(info) {
  if (!info.id) {
    console.warn("'id' is null, you must use a Babel plugin to populate this field automatically.");
    return;
  }

  if (!module.hot || module.hot.status() !== "apply") {
    // Allow the replacement of an existing item when we are in 'apply' mode of Webpack HMR.
    if (loadables[info.id])
      throw Error("ID conflict is detected in one of loadable components. Use 'signature' to resolve this issue.");
  }

  loadables[info.id] = info;
}

function get(id) {
  const info = loadables[id];
  if (!info)
    throw Error(`Invalid loadable component ID: ${id}`);
  return info;
}

function load(ids) {
  let promise = Promise.resolve();
  ids.forEach(id => {
    promise = promise.then(() => loadables[id].init());
  });
  return promise;
}

function loadAll(loaded=[]) {
  const ids = Object.keys(loadables).filter(id => {
    return loaded.indexOf(id) === -1;
  });
  if (ids.length) {
    return load(ids).then(() => {
      return loadAll(loaded.concat(ids));
    });
  } else {
    return Promise.resolve();
  }
}

exports.add = add;
exports.get = get;
exports.load = load;
exports.loadAll = loadAll;
