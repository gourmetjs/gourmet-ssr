"use strict";

const merge = require("@gourmet/merge");
const omit = require("@gourmet/omit");
const getReqArgs = require("@gourmet/get-req-args");
const ProxyHeaders = require("@gourmet/proxy-headers");
const sendContent = require("@gourmet/send-content");

function clientLambda(baseArgs) {
  function invoke(args_, callback) {
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

    let finished = false;
    const {args, rops, httpm} = _extractUrl(args_);

    if (!rops.headers)
      rops.headers = {};
    rops.headers["x-gourmet-args"] = _encodeArgs();

    const clientReq = httpm.request(rops, clientRes => {
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

  function context(options) {
    return clientLambda(options);
  }

  context.invoke = invoke;
  context.render = render;
  context.renderer = renderer;

  return context;
}

module.exports = clientLambda();
