"use strict";

const g = SERVER ? global : window;

module.exports = gmctx => {
  function _global(obj, name) {
    if (!obj)
      return "null";
    if (obj === (name ? g[name] : g))
      return "native";
    else
      return "polyfill";
  }

  function _module(req, res) {  // require, resolve
    function _load() {
      try {
        const m = req();
        if (typeof m === "object" && Object.keys(m).length === 0)
          return "empty";
        return typeof m;
      } catch (err) {
        if (err.code === "MODULE_NOT_FOUND")
          return "error";
        throw err;
      }
    }

    function _link() {
      if (exp !== "error") {
        const id = res();
        if (modules[id].startsWith("@extern:"))
          return "external";
        else
          return "bundle";
      }
    }

    const exp = _load();
    const link = _link();
    return exp + (link ? ` (${link})` : "");
  }

  function _load(name) {
    return require("./files/" + name + ".js");
  }

  let modules;

  if (SERVER) {
    modules = gmctx.manifest.server.modules;
    gmctx.data.modules = gmctx.manifest.client.modules;
  } else {
    modules = gmctx.data.modules;
  }

  const refs = JSON.stringify({
    console: _global(console, "console"),
    global: _global(global),
    process: _global(process, "process"),
    __filename: __filename,
    __dirname: __dirname,
    Buffer: _global(Buffer, "Buffer"),
    setImmediate: _global(setImmediate, "setImmediate"),
    path: _module(() => require("path"), () => require.resolve("path")),
    url: _module(() => require("url"), () => require.resolve("url")),
    fs: _module(() => require("fs"), () => require.resolve("fs")),
    domready: _module(() => require("domready"), () => require.resolve("domready")),
    rimraf: _module(() => require("rimraf"), () => require.resolve("rimraf")),
    classnames: _module(() => require("classnames"), () => require.resolve("classnames")),
    mkdirp: _module(() => require("mkdirp"), () => require.resolve("mkdirp")),
    none: _module(() => require("none"), () => require.resolve("none")),
    "./data.json": _module(() => require("./data.json"), () => require.resolve("./data.json")),
    context: _load(SERVER ? "1" : "2")
  }, null, 2);

  if (CLIENT) {
    const parent = document.getElementById("client_output");
    parent.innerText = refs;
  } else  {
    return `<pre id="server_output">${refs}</pre><pre id="client_output"></pre>`;
  }
};
