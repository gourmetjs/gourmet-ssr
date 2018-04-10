"use strict";

const npath = require("path");
const isStream = require("is-stream");
const merge = require("@gourmet/merge");
const con = require("@gourmet/console")("gourmet:html-renderer");
const handleRequestError = require("@gourmet/handle-request-error");
const resolveTemplate = require("@gourmet/resolve-template");
const pageTemplate = require("./pageTemplate");

const BODY_MAIN_PLACEHOLDER = "{{[__bodyMain__]}}";

// Options
//  - html: object / base content of html sections
//  - pageTemplate: string or compiled function
//  - renderParamsHeaderName: string (default: "x-gourmet-render-params")
//  - dataPropertyName: string (default: "__gourmet_data__")
//
// handleRequestError's options
//  - errorTemplate: string or compiled function
//  - hideErrorMessage: hide error message and show HTTP status text instead
//  - hideErrorStack: hide stack information from error response
//  - setUnhandledErrorHeader: string (default: "x-gourmet-unhandled-error")
//
// Params
//
module.exports = class HtmlServerRenderer {
  constructor(render, options={}) {
    this.options = options;
    this._userRenderer = render;
    this._pageTemplate = resolveTemplate(options.pageTemplate, pageTemplate);
  }

  invokeUserRenderer(gmctx) {
    return Promise.resolve().then(() => {
      return this._userRenderer(gmctx);
    });
  }

  renderToMedium(gmctx, content) {
    return content;
  }

  // Options
  //  - entrypoint
  //  - serverManifest
  //  - clientManifest
  getRenderer(opts) {
    return (req, res) => {
      const gmctx = this.createContext(req, res, opts);
      this.addDependencies(gmctx);
      this.invokeUserRenderer(gmctx).then(content => {
        return this.renderToMedium(gmctx, content);
      }).then(bodyMain => {
        return this.sendHtml(gmctx, bodyMain);
      }).catch(err => handleRequestError(err, req, res, this.options));
    };
  }

  createContext(req, res, {
    entrypoint,
    serverManifest,
    clientManifest
  }) {
    return {
      req, res,
      html: merge({
        lang: "en",
        headTop: [],
        headMain: [],
        headBottom: [],
        bodyTop: [],
        bodyBottom: []
      }, this.options.html),
      entrypoint,
      serverManifest,
      clientManifest,
      params: this.getParams(req),
      data: {
        // There are no fields automatically transfered to the client
        // because overriding this behavior is very easy in user code.
        //  - entrypoint,
        //  - staticPrefix: clientManifest.staticPrefix,
        //  - serverUrl: req.url
      }
    };
  }

  getParams(req) {
    const header = req.headers[this.options.renderParamsHeaderName || "x-gourmet-render-params"];
    if (header) {
      try {
        return JSON.parse(header);
      } catch (err) {
        if (err instanceof SyntaxError)
          return {};
        throw err;
      }
    } else {
      return {};
    }
  }

  // bodyMain can be one of the following:
  //  - string
  //  - buffer
  //  - stream
  sendHtml(gmctx, bodyMain) {
    const {req, res, html} = gmctx;

    // Because bundles are loaded with `defer` option, this data init code
    // always gets executed before the main entry code.
    const prop = this.options.dataPropertyName || "__gourmet_data__";
    const data = JSON.stringify(gmctx.data);

    html.headMain.push(
      `<script>window.${prop}=${data};</script>`
    );

    const content = this._pageTemplate({
      gmctx,
      lang: html.lang,
      headTop: html.headTop.join("\n"),
      headMain: html.headMain.join("\n"),
      headBottom: html.headBottom.join("\n"),
      bodyTop: html.bodyTop.join("\n"),
      bodyBottom: html.bodyBottom.join("\n")
    });
    const idx = content.indexOf(BODY_MAIN_PLACEHOLDER);

    if (idx === -1) {
      con.error("Page template doesn't have a placeholder for the body main");
      res.end(content);
      return;
    }

    res.setHeader("content-type", "text/html");

    res.write(content.substr(0, idx));

    if (isStream(bodyMain)) {
      bodyMain.pipe(res, {end: false});
      bodyMain.once("end", () => {
        res.end(content.substr(idx + BODY_MAIN_PLACEHOLDER.length));
      });
      bodyMain.once("error", err => {
        handleRequestError(err, req, res, this.options);
      });
    } else {
      if (bodyMain)
        res.write(bodyMain);
      res.end(content.substr(idx + BODY_MAIN_PLACEHOLDER.length));
    }
  }

  addDependencies(gmctx) {
    const entrypoint = gmctx.entrypoint;
    const manifest = gmctx.clientManifest;
    const staticPrefix = manifest.staticPrefix;
    const deps = manifest.entrypoints[entrypoint];
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
