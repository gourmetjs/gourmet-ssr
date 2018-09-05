"use strict";

const npath = require("path");
const promiseProtect = require("@gourmet/promise-protect");
const omit = require("@gourmet/omit");
const merge = require("@gourmet/merge");
const StorageFs = require("@gourmet/storage-fs");
const RendererSandbox = require("@gourmet/renderer-sandbox");
const getExported = require("@gourmet/get-exported");
const middlewareFactory = require("@gourmet/middleware");

const _defaultStorage = new StorageFs();

function clientLib(baseArgs) {
  function invoke(args, callback) {
    function _getCacheKey() {
      return `${serverDir}:${page}`;
    }

    function _loadBundle() {
      return storage.readFile(npath.join(serverDir, "manifest.json")).then(manifest => {
        manifest = JSON.parse(manifest.toString());
        const bundles = manifest.server.pages[page];
        if (!bundles)
          throw Error(`There is no '${page}' page in 'manifest.json'`);
        if (bundles.length !== 1)
          throw Error(`'${page}' should have only one bundle file`);
        const path = npath.join(serverDir, bundles[0]);
        return storage.readFile(path).then(bundle => {
          const sandbox = new RendererSandbox({
            code: bundle.toString(),
            vmOptions: {
              filename: path
            }
          });
          return {sandbox, manifest};
        });
      });
    }

    function _getRenderer({sandbox, manifest}) {
      const getter = getExported(sandbox.run());
      return getter({page, manifest});
    }

    function _done(err) {
      if (err)
        return callback(err);

      if (!item.render || siloed)
        item.render = _getRenderer(item);

      promiseProtect(() => {
        return item.render(args);
      }).then(result => {
        callback(null, result);
      }).catch(callback);
    }

    args = merge.intact(baseArgs, args);
    const {storage=_storage, serverDir, page="main", siloed} = args;
    args = omit(args, ["storage", "serverDir"]);

    if (!serverDir)
      throw Error("'serverDir' is required");

    const key = _getCacheKey();
    let item = _cache[key];

    if (item) {
      if (item.loading)
        item.queue.push(_done);
      else
        _done();
    } else {
      item = {
        loading: _loadBundle().then(({sandbox, manifest}) => {
          const q = item.queue;
          item.queue = item.loading = null;
          item.sandbox = sandbox;
          item.manifest = manifest;
          q.forEach(cb => cb());
        }).catch(err => {
          const q = item.queue;
          item.queue = item.loading = null;
          delete _cache[key];
          if (q)
            q.forEach(cb => cb(err));
          else
            _done(err);
        }),
        queue: [_done]
      };
      _cache[key] = item;
    }
  }

  function cleanCache() {
    _cache = {};
  }

  function setStorage(storage) {
    _storage = storage;
  }

  function context(options) {
    return clientLib(options);
  }

  let _storage = _defaultStorage;
  let _cache = {};

  context.setStorage = setStorage;
  context.invoke = invoke;
  context.cleanCache = cleanCache;
  context.middleware = middlewareFactory(context, {serveStatic: true});

  return context;
}

module.exports = clientLib();
