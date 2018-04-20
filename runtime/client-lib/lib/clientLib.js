"use strict";

const npath = require("path");
const serveStatic = require("serve-static");
const promiseProtect = require("@gourmet/promise-protect");
const omit = require("@gourmet/omit");
const merge = require("@gourmet/merge");
const StorageFs = require("@gourmet/storage-fs");
const getReqArgs = require("@gourmet/get-req-args");
const RendererSandbox = require("@gourmet/renderer-sandbox");
const getExported = require("@gourmet/get-exported");
const sendContent = require("@gourmet/send-content");

const _defaultStorage = new StorageFs();

function clientLib(baseArgs) {
  function invoke(args, callback) {
    function _getCacheKey() {
      return `${serverDir}:${entrypoint}`;
    }

    function _loadBundle() {
      return storage.readFile(npath.join(serverDir, "manifest.json")).then(manifest => {
        manifest = JSON.parse(manifest.toString());
        const bundles = manifest.server.entrypoints[entrypoint];
        if (!bundles)
          throw Error(`There is no '${entrypoint}' entrypoint in 'manifest.json'`);
        if (bundles.length !== 1)
          throw Error(`'${entrypoint}' should have only one bundle file`);
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
      return getter({entrypoint, manifest});
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
    const {storage=_storage, serverDir, entrypoint="main", siloed} = args;
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
          q.forEach(cb => cb(err));
        }),
        queue: [_done]
      };
      _cache[key] = item;
    }
  }

  // HTTP renderer extracting `args` from `req` and sending the result to `res`.
  // `next` is used only as an error handler.
  function render(req, res, next, args) {
    args = Object.assign(getReqArgs(req), args);
    invoke(args, (err, result) => {
      if (err) {
        next(err);
      } else {
        sendContent(res, result, err => {
          if (err)
            next(err);
        });
      }
    });
  }

  function renderer(args) {
    return function(req, res, next) {
      render(req, res, next, args);
    };
  }

  function cleanCache() {
    _cache = {};
  }

  function setStorage(storage) {
    _storage = storage;
  }

  function staticServer({clientDir}) {
    return serveStatic(clientDir, {
      fallthrough: false,
      index: false,
      redirect: false
    });
  }

  function context(options) {
    return clientLib(options);
  }

  let _storage = _defaultStorage;
  let _cache = {};

  context.setStorage = setStorage;
  context.invoke = invoke;
  context.render = render;
  context.renderer = renderer;
  context.cleanCache = cleanCache;
  context.static = staticServer;

  return context;
}

module.exports = clientLib();
