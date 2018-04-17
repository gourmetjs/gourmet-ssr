"use strict";

const npath = require("path");
const stream = require("stream");
const MultiStream = require("multistream");
const isStream = require("@gourmet/is-stream");
const merge = require("@gourmet/merge");
const promiseProtect = require("@gourmet/promise-protect");
const resolveTemplate = require("@gourmet/resolve-template");
const pageTemplate = require("./pageTemplate");

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
    return reqObj => {
      const gmctx = this.createContext(reqObj, opts);
      this.addDependencies(gmctx);
      return this.invokeUserRenderer(gmctx).then(content => {
        return this.renderToMedium(gmctx, content);
      }).then(bodyMain => {
        return this.renderHtml(gmctx, bodyMain);
      });
    };
  }

  createContext({path, query, params}, {entrypoint, manifest}) {
    const config = manifest.config || {};
    return {
      path,
      query,
      params,
      html: merge({
        lang: "en",
        headTop: [],
        headMain: [],
        headBottom: [],
        bodyTop: [],
        bodyBottom: []
      }, config.html),
      res: {
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
    };
  }

  // bodyMain can be one of the following:
  //  - string
  //  - buffer
  //  - stream
  renderHtml(gmctx, bodyMain) {
    const {html, res} = gmctx;

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
      statusCode: res.statusCode,
      headers: res.headers,
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
      const ext = npath.posix.extname(filename).toLowerCase();
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
};
