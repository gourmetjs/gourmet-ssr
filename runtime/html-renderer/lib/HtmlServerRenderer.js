"use strict";

const ppath = require("path").posix;
const stream = require("stream");
const MultiStream = require("multistream");
const isStream = require("@gourmet/is-stream");
const merge = require("@gourmet/merge");
const promiseProtect = require("@gourmet/promise-protect");
const resolveTemplate = require("@gourmet/resolve-template");
const pageTemplate = require("./pageTemplate");
const isAbsUrl = require("is-absolute-url");

const BODY_MAIN_PLACEHOLDER = "{{[__bodyMain__]}}";

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
      this.addDependencies(gmctx);
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
      },
      selfUrl: this.selfUrl
    }, args);
  }

  // bodyMain can be one of the following:
  //  - string
  //  - buffer
  //  - stream
  renderHtml(gmctx, bodyMain) {
    const {html, result} = gmctx;

    // Because bundles are loaded with `defer` option, this data init code
    // always gets executed before the main entry code.
    const prop = this.options.dataPropertyName || "__gourmet_data__";
    const data = JSON.stringify(gmctx.data);

    html.headMain.push(
      `<script>window.${prop}=${data};</script>`
    );

    const frame = this._pageTemplate({
      gmctx,
      lang: html.lang,
      headTop: html.headTop.join("\n"),
      headMain: html.headMain.join("\n"),
      headBottom: html.headBottom.join("\n"),
      bodyTop: html.bodyTop.join("\n"),
      bodyBottom: html.bodyBottom.join("\n")
    });
    const idx = frame.indexOf(BODY_MAIN_PLACEHOLDER);

    if (idx === -1)
      throw Error("Page template doesn't have a placeholder for the body main");

    const header = Buffer.from(frame.substr(0, idx));
    const footer = Buffer.from(frame.substr(idx + BODY_MAIN_PLACEHOLDER.length));
    let content;

    if (isStream(bodyMain)) {
      content = new MultiStream([
        _bufStream(header),
        bodyMain,
        _bufStream(footer)
      ]);
    } else {
      content = Buffer.concat([
        header,
        Buffer.isBuffer(bodyMain) ? bodyMain : Buffer.from(bodyMain),
        footer
      ]);
    }

    return {
      statusCode: result.statusCode,
      headers: result.headers,
      content
    };
  }

  addDependencies(gmctx) {
    const entrypoint = gmctx.entrypoint;
    const manifest = gmctx.manifest;
    const staticPrefix = manifest.staticPrefix;
    const deps = manifest.client.entrypoints[entrypoint];
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

  // Note that `this` is bound to gmctx, not HtmlServerRenderer instance.
  selfUrl(url) {
    function _proto() {
      let xfp = gmctx.headers["x-forwarded-proto"];

      if (xfp) {
        // 'x-forwarded-proto' must be a single value no matter how many proxies
        // were involved before reaching this host. But some proxies send comma
        // separated multiple values like 'x-forwarded-for'.
        const idx = xfp.indexOf(",");

        if (idx !== -1)
          xfp = xfp.substr(0, idx);

        xfp = xfp.trim().toLowerCase();

        if (xfp === "http" || xfp === "https")
          return xfp;
      }

      return gmctx.encrypted ? "https" : "http";
    }

    function _host() {
      let xfh = gmctx.headers["x-forwarded-host"];

      if (xfh) {
        // 'x-forwarded-host' must be a single value no matter how many proxies
        // were involved before reaching this host. But some proxies send comma
        // separated multiple values like 'x-forwarded-for'.
        const idx = xfh.indexOf(",");

        if (idx !== -1)
          xfh = xfh.substr(0, idx);

        xfh = xfh.trim().toLowerCase();

        if (xfh)
          return xfh;
      }

      const host = gmctx.headers.host;

      if (!host)
        throw Error("There is no 'host' or 'x-forwarded-host' header.");

      return host;
    }

    const gmctx = this;

    if (isAbsUrl(url))
      return url;   // already absolute

    if (url.startsWith("//"))     // protocol relative ("//example.com")
      return _proto() + ":" + url;

    if (url[0] !== "/") {   // relative path based on the current path
      if (url.endsWith("/"))
        url = ppath.join(gmctx.path, url);
      else
        url = ppath.join(ppath.dirname(gmctx.path), url);
    }

    return _proto() + "://" + _host() + url;
  }
};
