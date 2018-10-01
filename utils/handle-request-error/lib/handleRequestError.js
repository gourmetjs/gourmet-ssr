"use strict";

const HttpStatus = require("http-status");
const stripAnsi = require("strip-ansi");
const escapeHtml = require("escape-html");
const getConsole = require("@gourmet/console");
const merge = require("@gourmet/merge");
const serializeRequestError = require("@gourmet/serialize-request-error");
const inspectError = require("@gourmet/inspect-error");
const sendContent = require("@gourmet/send-content");
const resolveTemplate = require("@gourmet/resolve-template");
const errorTemplate = require("./errorTemplate");

const _defaultRenderers = {
  html: renderHtmlError,
  json: renderJsonError
};

function renderHtmlError(err, req, res, obj, options) {
  if (obj.statusCode === undefined)
    obj.statusCode = 500;

  let message;

  if (options.hideMessage) {
    message = HttpStatus[obj.statusCode];
    if (message === undefined)
      message = "Unknown error";
  } else {
    message = obj.message;
  }

  const content = options.template({
    head: options.head.join("\n"),
    message: escapeHtml(stripAnsi(message)),
    statusCode: obj.statusCode,
    detail: options.debug ? escapeHtml(stripAnsi(inspectError(obj))) : null
  });

  return {
    statusCode: obj.statusCode,
    headers: {
      "content-type": "text/html; charset=utf-8"
    },
    content
  };
}

function renderJsonError(err, req, res, obj, options) {
  const content = JSON.stringify({
    error: {
      name: obj.name,
      message: stripAnsi(obj.message),
      code: obj.code,
      statusCode: obj.statusCode,
      detail: options.debug ? obj : null
    }
  });

  return {
    statusCode: obj.statusCode,
    headers: {
      "content-type": "application/json"
    },
    content
  };
}

function handleRequestError(err, req, res, options) {
  const _handle = () => {
    const obj = serializeRequestError(req, err, options);

    if (res.headersSent) {
      con.error(`${options.desc} (response headers already sent, destroying socket)\n${inspectError(obj, 1)}`);
      if (res.socket)
        res.socket.destroy();
      return;
    }

    const type = options.detect(req);
    const render = (options.renderers && options.renderers[type]) || _defaultRenderers[type];
    const result = render(err, req, res, obj, options);

    sendContent(res, result);

    con.error(`${options.desc}\n${inspectError(obj, 1)}`);
  };

  options = options ? merge({}, handleRequestError.defaultOptions, options) : handleRequestError.defaultOptions;

  const con = options.console;

  try {
    _handle();
  } catch (e) {
    con.error("Exception thrown from handleRequestError");
    con.error("  original:", err);
    con.error("  exception:", e);
  }
}

handleRequestError.defaultOptions = {
  console: getConsole("gourmet:net"),
  desc: "Error in serving a request",
  hideMessage: false,
  debug: true,
  head: [],
  template: resolveTemplate(errorTemplate),
  detect(req) {
    const accept = req.headers["accept"];
    if (accept && accept.indexOf("/json") !== -1)
      return "json";
    else
      return "html";
  }
};

module.exports = handleRequestError;
