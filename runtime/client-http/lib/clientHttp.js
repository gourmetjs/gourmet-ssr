"use strict";

const http = require("http");
const nurl = require("url");
const merge = require("@gourmet/merge");
const omit = require("@gourmet/omit");
const getReqArgs = require("@gourmet/get-req-args");
const ProxyHeaders = require("@gourmet/proxy-headers");
const sendContent = require("@gourmet/send-content");
const webProxy = require("@gourmet/web-proxy");

const _defaultAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30 * 1000,
  maxSockets: 256,
  maxFreeSockets: 128
});

function clientHttp(baseArgs) {
  function _parseUrl(serverUrl) {
    let reqOpts;

    if (typeof serverUrl === "string")
      reqOpts = nurl.parse(serverUrl);
    else if (typeof serverUrl === "object")
      reqOpts = Object.assign({}, serverUrl);
    else
      throw Error("serverUrl is invalid");

    if (reqOpts.agent)
      reqOpts.agent = _defaultAgent;

    return reqOpts;
  }

  function invoke(args, callback) {
    function _encodeArgs() {
      const content = JSON.stringify(args);
      return Buffer.from(content).toString("base64");
    }

    function _done(err, result) {
      if (!finished) {
        finished = true;
        callback(err, result);
      }
    }

    args = merge.intact(baseArgs, args);
    const {
      serverUrl="http://localhost:3939",
      headers,
      agent=_defaultAgent,
      request=http.request
    } = args;
    args = omit(args, ["serverUrl", "headers", "agent", "request"]);

    let info;
    let finished;

    if (typeof serverUrl === "string")
      info = nurl.parse(serverUrl);
    else if (typeof serverUrl === "object")
      info = Object.assign({}, serverUrl);
    else
      throw Error("serverUrl is invalid");

    info = Object.assign(info, {
      method: "GET",
      headers: Object.assign({}, headers, {
        "x-gourmet-args": _encodeArgs()
      }),
      agent
    });

    const clientReq = request(info, clientRes => {
      const result = {
        statusCode: clientRes.statusCode,
        headers: new ProxyHeaders(clientRes).getHeadersCase(),
        content: clientRes
      };
      _done(null, result);
    });

    clientReq.on("error", _done);

    clientReq.end();
  }

  function render(req, res, next, args) {
    args = Object.assign(getReqArgs(req), args);
    invoke(args, (err, result) => {
      if (err) {
        next(err);
      } else {
        sendContent(res, result, err => {
          if (err)
            next(err);
        });
      }
    });
  }

  function renderer(args) {
    return function(req, res, next) {
      render(req, res, next, args);
    };
  }

  function staticServer({serverUrl}) {
    return (req, res, next) => {
      webProxy(req, res, {

      }, {
        handleError: next
      });
    };
  }

  function context(options) {
    return clientHttp(options);
  }

  context.invoke = invoke;
  context.render = render;
  context.renderer = renderer;
  context.static = staticServer;

  return context;
}

module.exports = clientHttp();
