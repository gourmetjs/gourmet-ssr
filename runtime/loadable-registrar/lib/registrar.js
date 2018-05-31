"use strict";

const loadables = {};

function add(info) {
  if (!info.id) {
    console.warn("'id' is null, you must use a Babel plugin to populate this field automatically.");
    return;
  }
  loadables[info.id] = info;
}

function load(ids) {
  return Promise.all(ids.map(id => {
    return loadables[id].init();
  }));
}

function loadAll(loaded=[]) {
  const ids = Object.keys(loadables).filter(id => {
    return loaded.indexOf(id) === -1;
  });
  return load(ids).then(() => {
    return loadAll(loaded.concat(ids));
  });
}

exports.add = add;
exports.load = load;
exports.loadAll = loadAll;
