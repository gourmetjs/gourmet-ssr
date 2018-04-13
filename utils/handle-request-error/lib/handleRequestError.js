"use strict";

const HttpStatus = require("http-status");
const baseCon = require("@gourmet/console")("gourmet:http");
const serializeRequestError = require("@gourmet/serialize-request-error");
const inspectError = require("@gourmet/inspect-error");
const sendContent = require("@gourmet/send-content");
const resolveTemplate = require("@gourmet/resolve-template");
const errorTemplate = require("./errorTemplate");

const _defaultTemplate = resolveTemplate(errorTemplate);

module.exports = function handleRequestError(err, req, res, options={}) {
  const _handle = () => {
    if (res.headersSent) {
      con.error("Response headers already sent, destroying socket.");
      if (res.socket)
        res.socket.destroy();
      return;
    }

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

    const t = options.errorTemplate ? resolveTemplate(options.errorTemplate) : _defaultTemplate;

    const content = t({
      message: message,
      statusCode: obj.statusCode,
      detail: options.hideErrorStack ? null :  inspectError(obj)
    });
    const headers = {};

    // LATER: serialize err and send
    if (options.setUnhandledErrorHeader === undefined || options.setUnhandledErrorHeader)
      headers[options.setUnhandledErrorHeader || "x-gourmet-unhandled-error"] = "true";

    sendContent(res, {content, statusCode: obj.statusCode, headers});

    con.error("Error in serving a request\n", inspectError(obj, 1));
  };

  const con = options.console || baseCon;

  try {
    _handle();
  } catch (e) {
    con.error("Exception thrown from handleRequestError");
    con.error("  original:", err);
    con.error("  exception:", e);
  }
};
