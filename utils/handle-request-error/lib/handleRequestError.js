"use strict";

const HttpStatus = require("http-status");
const getConsole = require("@gourmet/console");
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
    message: message,
    statusCode: obj.statusCode,
    detail: options.debug ? inspectError(obj) : null
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
      message: obj.message,
      code: obj.code,
      statusCode: obj.statusCode,
      detail: options.debug ? null : obj
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
    if (res.headersSent) {
      con.error(`${options.title}\nResponse headers already sent, destroying socket.`);
      if (res.socket)
        res.socket.destroy();
      return;
    }

    const obj = serializeRequestError(req, err, options);
    const type = options.detect(req);
    const render = (options.renderers && options.renderers[type]) || _defaultRenderers[type];
    const result = render(err, req, res, obj, options);

    sendContent(res, result);

    con.error(`${options.title}\n${inspectError(obj, 1)}`);
  };

  options = Object.assign(handleRequestError.defaultOptions, options);

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
  title: "Error in serving a request",
  hideMessage: false,
  debug: true,
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
