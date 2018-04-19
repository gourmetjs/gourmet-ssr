"use strict";

const http = require("http");
const nurl = require("url");
const merge = require("@gourmet/merge");
const omit = require("@gourmet/omit");
const getReqArgs = require("@gourmet/get-req-args");
const sendContent = require("@gourmet/send-content");

const HOP_BY_HOP_HEADERS = {
  "connection": true,
  "keep-alive": true,
  "public": true,
  "proxy-authenticate": true,
  "transfer-encoding": true,
  "upgrade": true
};

const _defaultAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30 * 1000,
  maxSockets: 256,
  maxFreeSockets: 128
});

function _copyHeaders(headers, rawHeaders) {
  const headerCaseMap = {};
  for (let idx = 0; idx < rawHeaders.length; idx += 2) {
    const key = rawHeaders[idx];
    headerCaseMap[key.toLowerCase()] = key;
  }

  return Object.keys(headers).reduce((obj, key) => {
    if (!HOP_BY_HOP_HEADERS[key])
      obj[headerCaseMap[key]] = headers[key];
    return obj;
  }, {});
}

function clientHttp(baseArgs) {
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
        headers: _copyHeaders(clientRes.headers, clientRes.rawHeaders),
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

  function getRenderer(args) {
    return function(req, res, next) {
      render(req, res, next, args);
    };
  }

  function create(options) {
    return clientHttp(options);
  }

  return {
    invoke,
    render,
    getRenderer,
    create
  };
}

module.exports = clientHttp();
