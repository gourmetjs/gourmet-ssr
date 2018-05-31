"use strict";

const ppath = require("path").posix;
const stream = require("stream");
const MultiStream = require("multistream");
const isStream = require("@gourmet/is-stream");
const merge = require("@gourmet/merge");
const promiseProtect = require("@gourmet/promise-protect");
const resolveTemplate = require("@gourmet/resolve-template");
const pageTemplate = require("./pageTemplate");

const BODY_MAIN_PLACEHOLDER = "{{[__bodyMain__]}}";
const BODY_TAIL_PLACEHOLDER = "{{[__bodyTail__]}}";

function _bufStream(buf) {
  return new stream.Readable({
    read() {
      this.push(buf);
      this.push(null);
    }
  });
}

// Options
//  - html: object / base content of html sections
//  - pageTemplate: string or compiled function
//  - dataPropertyName: string (default: "__gourmet_data__")
//
module.exports = class HtmlServerRenderer {
  constructor(render, options={}) {
    this.options = options;
    this._userRenderer = render;
    this._pageTemplate = resolveTemplate(options.pageTemplate, pageTemplate);
  }

  invokeUserRenderer(gmctx) {
    return promiseProtect(() => {
      return this._userRenderer(gmctx);
    });
  }

  renderToMedium(gmctx, content) {
    return content;
  }

  // Options
  //  - entrypoint
  //  - manifest
  getRenderer(opts) {
    return args => {
      const gmctx = this.createContext(args, opts);
      this.renderStaticDeps(gmctx);
      return this.invokeUserRenderer(gmctx).then(content => {
        return this.renderToMedium(gmctx, content);
      }).then(bodyMain => {
        return this.renderHtml(gmctx, bodyMain);
      });
    };
  }

  createContext(args, {entrypoint, manifest}) {
    const config = manifest.config || {};
    return Object.assign({
      isServer: true,
      isClient: false,
      html: merge({
        lang: "en",
        headTop: [],
        headMain: [],
        headBottom: [],
        bodyTop: [],
        bodyBottom: []
      }, config.html),
      result: {
        statusCode: 200,
        headers: {}
      },
      entrypoint,
      manifest,
      data: {
        // There are no fields automatically transfered to the client
        // because overriding this behavior is very easy in user code.
        //  - entrypoint
        //  - path
        //  - staticPrefix: manifest.staticPrefix
      }
    }, args);
  }

  // bodyMain can be one of the following:
  //  - string
  //  - buffer
  //  - stream
  renderHtml(gmctx, bodyMain) {
    const {html, result} = gmctx;

    const frame = this._pageTemplate({
      gmctx,
      lang: html.lang,
      headTop: html.headTop.join("\n"),
      headMain: html.headMain.join("\n"),
      headBottom: html.headBottom.join("\n"),
      bodyTop: html.bodyTop.join("\n"),
      bodyBottom: html.bodyBottom.join("\n")
    });

    const spos = frame.indexOf(BODY_MAIN_PLACEHOLDER);
    const epos = frame.indexOf(BODY_TAIL_PLACEHOLDER);

    if (spos === -1 || epos === -1)
      throw Error("Page template doesn't have placeholders for the body content");

    const header = Buffer.from(frame.substr(0, spos));
    const filler = Buffer.from(frame.substring(spos + BODY_MAIN_PLACEHOLDER.length, epos));
    const footer = Buffer.from(frame.substr(epos + BODY_TAIL_PLACEHOLDER.length));
    let content;

    if (isStream(bodyMain)) {
      content = new MultiStream([
        _bufStream(header),
        bodyMain,
        _bufStream(filler),
        () => _bufStream(Buffer.from(this.getBodyTail(gmctx))), // lazy evaluation
        _bufStream(footer)
      ]);
    } else {
      content = Buffer.concat([
        header,
        Buffer.isBuffer(bodyMain) ? bodyMain : Buffer.from(bodyMain),
        Buffer.from(this.getBodyTail(gmctx)),
        footer
      ]);
    }

    return {
      statusCode: result.statusCode,
      headers: result.headers,
      content
    };
  }

  getStaticDeps(gmctx) {
    return gmctx.manifest.client.entrypoints[gmctx.entrypoint];
  }

  renderStaticDeps(gmctx) {
    const deps = this.getStaticDesp(gmctx);
    const staticPrefix = gmctx.manifest.staticPrefix;
    const styles = [];
    const scripts = [];

    deps.forEach(filename => {
      const ext = ppath.extname(filename).toLowerCase();
      if (ext === ".css")
        styles.push(`<link rel="stylesheet" type="text/css" href="${staticPrefix}${filename}">`);
      else
        scripts.push(`<script async src="${staticPrefix}${filename}"></script>`);
    });

    if (styles.length)
      gmctx.html.headMain.push(styles.join("\n"));

    if (scripts.length)
      gmctx.html.headMain.push(scripts.join("\n"));
  }

  getBodyTail(gmctx) {
    const prop = this.options.dataPropertyName || "__gourmet_data__";
    const data = JSON.stringify(gmctx.data);
    return [
      `<script>window.${prop}=${data};</script>`
    ].join("\n");
  }

  getBundles(gmctx, modules, exclude=[]) {
    function _find(moduleId) {
      const names = Object.keys(files).filter(name => {
        const info = files[name];
        if (info.modules[moduleId]) {
          info.ref++;
          return true;
        }
      });
      if (!names.length)
        throw Error(`No bundle contains the module with ID: ${moduleId}`);
      return names;
    }

    function _pickMax(names) {
      let maxIdx = 0;
      names.forEach((name, idx) => {
        if (files[name].ref > files[names[maxIdx]].ref)
          maxIdx = idx;
      });
      return names[maxIdx];
    }

    const manifest = gmctx.manifest.client;

    // modules to exclude: {moduleId: true, ...}
    const excludeMap = exclude.reduce((obj, name) => {
      const info = manifest.files[name];
      if (!info)
        throw Error(`Asset '${name}' is not defined in manifest.json`);
      if (info.modules)
        info.modules.forEach(id => obj[id] = true);
      return obj;
    }, {});

    // module IDs by path: {"path": id, ...}
    const moduleMap = Object.keys(manifest.modules).reduce((obj, id) => {
      const path = manifest.modules[id];
      obj[path] = id;
      return obj;
    }, {});

    // files {name: {ref: n, modules: {id: true, ...}}, ...}
    const files = Object.keys(manifest.files).reduce((obj, name) => {
      const info = manifest.files[name];
      if (info.modules) {
        obj[name] = {
          ref: 0,
          modules: info.modules.reduce((obj, id) => {
            obj[id] = true;
            return obj;
          }, {})
        };
      }
      return obj;
    }, {});

    const items = [];

    modules.forEach(path => {
      const id = moduleMap[path];
      if (id === undefined)
        throw Error(`Invalid module path: ${path}`);
      if (excludeMap[id])
        return;
      items.push(_find(id));
    });

    const bundles = items.reduce((obj, names) => {
      const name = _pickMax(names);
      obj[name] = true;
      return obj;
    }, {});

    return Object.keys(bundles);
  }
};
