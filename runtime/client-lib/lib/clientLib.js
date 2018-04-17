"use strict";

const npath = require("path");
const nurl = require("url");
const promiseProtect = require("@gourmet/promise-protect");
const StorageFs = require("@gourmet/storage-fs");
const RendererSandbox = require("@gourmet/renderer-sandbox");
const getExported = require("@gourmet/get-exported");
const sendContent = require("@gourmet/send-content");

const _defaultStorage = new StorageFs();

function clientLib(storage=_defaultStorage) {
  let _cache = {};

  // Base renderer getting `reqObj` and returning `resObj`.
  function renderRaw(reqObj, {
    serverDir,
    entrypoint,
    siloed
  }, callback) {
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
        return item.render(reqObj);
      }).then(resObj => {
        callback(null, resObj);
      }).catch(callback);
    }

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
          q.forEach(cb => cb(err));
        }),
        queue: [_done]
      };
      _cache[key] = item;
    }
  }

  // HTTP renderer getting `req` and sending the result to `res`.
  // `next` is used only as an error handler.
  function render(req, res, next, options) {
    function _req_obj() {
      function _url() {
        if (!parsedUrl)
          parsedUrl = nurl.parse(req.url, true);
        return parsedUrl;
      }

      let parsedUrl;

      const path = typeof req.path === "string" ? req.path : _url().pathname;
      const query = req.query ? req.query : _url().query;
      return {
        path, query, params: options.params || {}
      };
    }

    renderRaw(_req_obj(), options, (err, resObj) => {
      if (err) {
        next(err);
      } else {
        sendContent(res, resObj, err => {
          if (err)
            next(err);
        });
      }
    });
  }

  function getRenderer(options) {
    return function(req, res, next) {
      render(req, res, next, options);
    };
  }

  function cleanCache() {
    _cache = {};
  }

  return {
    renderRaw,
    render,
    getRenderer,
    cleanCache
  };
}

module.exports = clientLib;
