"use strict";

const npath = require("path");
const template = require("lodash.template");
const errlog = require("debug")("error:html-renderer");
const isStream = require("is-stream");
const HttpStatus = require("http-status");
const merge = require("@gourmet/merge");
const serializeRequestError = require("@gourmet/serialize-request-error");
const inspectError = require("@gourmet/inspect-error");
const sendContent = require("@gourmet/send-content");
const pageTemplate = require("./pageTemplate");
const errorTemplate = require("./errorTemplate");

const INTERPOLATE_RE = /{{(\w[\w.]*)}}/g;
const BODY_MAIN_PLACEHOLDER = "{{[__bodyMain__]}}";

// Options
//  - html: object / base content of html sections
//  - pageTemplate: string or compiled function
//  - errorTemplate: string or compiled function
//  - hideErrorMessage: hide error message and show HTTP status text instead
//  - hideErrorStack: hide stack information from error response
//  - setUnhandledErrorHeader: string (default: "x-gourmet-unhandled-error")
//  - renderParamsHeaderName: string (default: "x-gourmet-render-params")
//  - dataPropertyName: string (default: "__gourmet_data__")
//
// Params
//
module.exports = class HtmlServerRenderer {
  constructor(render, options={}) {
    this.options = options;
    this._userRenderer = render;
    this._pageTemplate = this._getTemplate("pageTemplate", pageTemplate);
    this._errorTemplate = this._getTemplate("errorTemplate", errorTemplate);
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
      }).catch(err => this.handleError(err, req, res));
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
      errlog("Page template doesn't have a placeholder for the body main");
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
        this.handleError(err, req, res);
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

  handleError(err, req, res) {
    const _handle = () => {
      if (res.headersSent) {
        errlog("Response headers already sent, destroying socket.");
        if (res.socket)
          res.socket.destroy();
        return;
      }

      const options = this.options;
      const obj = serializeRequestError(req, err);

      if (obj.statusCode === undefined)
        obj.statusCode = 500;

      let message;

      if (options.hideErrorMessage) {
        message = HttpStatus[obj.statusCode];
        if (message === undefined)
          message = "Unknown error";
      } else {
        message = obj.message;
      }

      const content = this._errorTemplate({
        message: message,
        statusCode: obj.statusCode,
        detail: options.hideErrorStack ? null :  inspectError(obj)
      });
      const headers = {};

      // LATER: serialize err and send
      if (options.setUnhandledErrorHeader === undefined || options.setUnhandledErrorHeader)
        headers[options.setUnhandledErrorHeader || "x-gourmet-unhandled-error"] = "true";

      sendContent(res, content, obj.statusCode, headers);

      if (errlog.enabled)
        errlog("Error in rendering\n", inspectError(obj, 1));
    };

    try {
      _handle();
    } catch (e) {
      console.error("Exception thrown from handleError");
      console.error("  original:", err);
      console.error("  exception:", e);
    }
  }

  _getTemplate(name, defaultTemplate) {
    const options = this.options;
    if (typeof options[name] === "function") {
      return options[name];
    } else if (typeof options[name] === "string") {
      return template(options[name], {interpolate: INTERPOLATE_RE});
    } else {
      return template(defaultTemplate, {interpolate: INTERPOLATE_RE});
    }
  }
};
