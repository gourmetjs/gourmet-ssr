"use strict";

const http = require("http");
const https = require("https");
const getReqOpts = require("@gourmet/get-req-opts");
const httpModule = require("@gourmet/http-module");
const merge = require("@gourmet/merge");
const ProxyHeaders = require("@gourmet/proxy-headers");
const middlewareFactory = require("@gourmet/middleware");

const _defaultAgent = {
  http: new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 30 * 1000,
    maxSockets: 256,
    maxFreeSockets: 128
  }),
  https: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 30 * 1000,
    maxSockets: 256,
    maxFreeSockets: 128
  })
};

function clientHttp(baseOptions) {
  function _getReqOpts(options) {
    const reqOpts = getReqOpts(options.serverUrl);
    const httpm = httpModule(reqOpts.protocol);

    if (!reqOpts.agent)
      reqOpts.agent = httpm === https ? _defaultAgent.https : _defaultAgent.http;

    return {reqOpts, httpm};
  }

  function invoke(options, callback) {
    function _encodeContext() {
      const context = Object.assign({page: options.page, siloed: options.siloed}, options.context);
      const content = JSON.stringify(context);
      return Buffer.from(content).toString("base64");
    }

    function _done(err, result) {
      if (!finished) {
        finished = true;
        callback(err, result);
      }
    }

    options = merge.intact(gourmet.baseOptions, options);

    let finished = false;
    const {reqOpts, httpm} = _getReqOpts(options);

    if (!reqOpts.headers)
      reqOpts.headers = {};

    reqOpts.headers["x-gourmet-context"] = _encodeContext();

    const clientReq = httpm.request(reqOpts, clientRes => {
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

  function gourmet(options) {
    return clientHttp(options);
  }

  gourmet.baseOptions = merge.intact({
    serverUrl: "http://localhost:3939/",
    page: "main",
    siloed: false,
    staticMiddleware: "proxy"
  }, baseOptions);

  gourmet.invoke = invoke;
  gourmet.middleware = middlewareFactory(gourmet);
  gourmet.getReqOpts = options => _getReqOpts(options).reqOpts;

  return gourmet;
}

module.exports = clientHttp();
