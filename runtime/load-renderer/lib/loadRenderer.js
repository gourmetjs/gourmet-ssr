"use strict";

const npath = require("path");
const nfs = require("fs");
const RendererSandbox = require("@gourmet/renderer-sandbox");
const getExported = require("@gourmet/get-exported");

function _loadInfo(serverDir, entrypoint, fs) {
  const serverManifest = JSON.parse(fs.readFileSync(npath.join(serverDir, "server_manifest.json"), "utf8"));
  const clientManifest = JSON.parse(fs.readFileSync(npath.join(serverDir, "client_manifest.json"), "utf8"));
  const bundles = serverManifest.entrypoints[entrypoint];
  if (!bundles)
    throw Error(`There is no '${entrypoint}' entrypoint in 'server_manifest.json'`);
  if (bundles.length !== 1)
    throw Error(`'${entrypoint} should have only one bundle file`);
  const serverBundlePath = npath.join(serverDir, bundles[0]);
  const serverBundle = fs.readFileSync(serverBundlePath, "utf8");
  return {
    serverManifest,
    clientManifest,
    serverBundle,
    serverBundlePath
  };
}

// Do a lazy load to prevent errors in react-hot-loader middleware
module.exports = function loadRenderer({
  serverDir,
  entrypoint="main",
  handlerName,
  sandbox: vars,
  fs=nfs
}) {
  let renderer = (req, res) => {
    const {
      serverManifest,
      clientManifest,
      serverBundle,
      serverBundlePath
    } = _loadInfo(serverDir, entrypoint, fs);

    const sandbox = new RendererSandbox({
      code: serverBundle,
      vars,
      vmOptions: {
        filename: serverBundlePath
      }
    });
    const getRenderer = getExported(sandbox.run(), handlerName);

    renderer = getRenderer({
      entrypoint,
      serverManifest,
      clientManifest
    });

    renderer(req, res);
  };

  return (req, res) => {
    renderer(req, res);
  };
};
