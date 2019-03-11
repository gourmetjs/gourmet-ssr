"use strict";

const ppath = require("path").posix;
const stream = require("stream");
const MultiStream = require("@gourmet/multi-stream");
const isStream = require("@gourmet/is-stream");
const merge = require("@gourmet/merge");
const promiseProtect = require("@gourmet/promise-protect");
const resolveTemplate = require("@gourmet/resolve-template");
const escapeScript = require("@gourmet/escape-script");
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

// options: provided by init function (from `builder.initOptions`)
//  - html: object / base content of html sections
//  - pageTemplate: string or compiled function (define your own init function to set the compiled function)
//  - dataPropertyName: string (default: "__gourmet_data__")
class HtmlServerRenderer {
  constructor(userObject, options) {
    this.userObject = userObject;
    this.options = options || {};
    this._pageTemplate = resolveTemplate(this.options.pageTemplate, pageTemplate);
  }

  // spec: provided by `RendererSandbox`
  //  - page
  //  - manifest
  // context: provided by clients when requesting the rendering
  //  - reqArgs: {url, method, headers, encrypted}
  //    * see `@gourmet/get-req-args` for the latest info.
  //  - other custom context values
  getRenderer(spec) {
    return context => {
      let gmctx;
      return promiseProtect(() => {
        gmctx = this.createContext(context, spec);
        return this.prepareToRender(gmctx);
      }).then(cont => {
        if (cont !== false)
          return this.invokeUserRenderer(gmctx);
      }).then(content => {
        const bodyMain = this.renderToMedium(gmctx, content);
        return this.renderHtml(gmctx, bodyMain);
      });
    };
  }

  createContext(context, {page, manifest}) {
    const config = manifest.config || {};
    const gmctx = merge({
      isServer: true,
      isClient: false,
      renderer: this,
      html: {
        lang: "en",
        headTop: [],
        headMain: [],
        headBottom: [],
        bodyTop: [],
        bodyBottom: []
      },
      result: {
        statusCode: 200,
        headers: {}
      },
      page,
      manifest,
      data: {}
    }, {html: this.collectConfig(config, "html", page)}, context || undefined);
    return gmctx;
  }

  // Do per-rendering preparation tasks.
  // If this function returns `false` or a promise fulfilled with `false`,
  // `invokeUserRenderer()` is skipped.
  prepareToRender(gmctx) { // eslint-disable-line no-unused-vars
  }

  // Do the actual rendering and returns an rendered object.
  // Default implementation assumes that the `userObject` is a function.
  invokeUserRenderer(gmctx) {
    return this.userObject(gmctx);
  }

 
  // This is a synchronous function
  renderToMedium(gmctx, content) {
    return content;
  }

  // bodyMain can be one of the following:
  //  - string
  //  - buffer
  //  - stream
  renderHtml(gmctx, bodyMain) {
    if (gmctx.result.content)
      return gmctx.result;  // skip and return the overridden content as-is

    if (!bodyMain)
      return null;  // route not found

    this.renderStaticDeps(gmctx);

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
    return gmctx.manifest.client.pages[gmctx.page];
  }

  renderStaticDeps(gmctx) {
    const deps = this.getStaticDeps(gmctx);
    const staticPrefix = gmctx.manifest.client.staticPrefix;
    const styles = [];
    const scripts = [];

    deps.forEach(filename => {
      const ext = ppath.extname(filename).toLowerCase();
      if (ext === ".css")
        styles.push(`<link rel="stylesheet" type="text/css" href="${staticPrefix}${filename}">`);
      else
        scripts.push(`<script defer src="${staticPrefix}${filename}"></script>`);
    });

    if (styles.length)
      gmctx.html.headMain.push(styles.join("\n"));

    if (scripts.length)
      gmctx.html.headMain.push(scripts.join("\n"));
  }

  getBodyTail(gmctx) {
    const prop = this.options.dataPropertyName || "__gourmet_data__";
    const data = escapeScript(JSON.stringify(gmctx.data));
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
      let id = moduleMap[path];
      if (id === undefined) {
        id = moduleMap["@concat:" + path];
        if (id === undefined)
          throw Error(`Invalid module path: ${path}`);
      }
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

  // Supported patterns are:
  //  - Section name only for all pages: "html"
  //  - For a specific page: "html:main"
  //  - For multiple pages: "html:main,admin"
  collectConfig(config, section, page) {
    const obj = merge({}, config[section]);
    Object.keys(config).forEach(name => {
      if (name.startsWith(`${section}:`)) {
        const names = name.substring(section.length + 1).split(",");
        if (names.indexOf(page) !== -1)
          merge(obj, config[name]);
      }
    });
    return obj;
  }
}

module.exports = function getHtmlServerRenderer(Base) {
  if (Base)
    throw Error("`@gourmet/html-renderer` must be the first one in the renderer chain. Check your configuration.");
  return HtmlServerRenderer;
};
