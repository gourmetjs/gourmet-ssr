"use strict";

const pump = require("pump");
const error = require("@gourmet/error");
const httpModule = require("@gourmet/http-module");
const getReqOpts = require("@gourmet/get-req-opts");
const ProxyHeaders = require("@gourmet/proxy-headers");
const handleRequestError = require("@gourmet/handle-request-error");

const REQUEST_ABORTED = {
  message: "Request aborted",
  code: "REQUEST_ABORTED"
};

class WebProxy {
  constructor(options={}) {
    this.options = options;

    if (typeof options.handleError === "function")
      this.handleError = options.handleError;
  }

  // initializes the request options
  initReqOpts() {
    const reqOpts = this.reqOpts;
    reqOpts.method = this.req.method;
    reqOpts.headers = this.getProxyReqHeaders();
    return reqOpts;
  }

  createProxyReq() {
    const reqOpts = this.reqOpts;
    this.proxyReq = httpModule(reqOpts.protocol).request(reqOpts);
  }

  abort() {
    this.proxyReq.abort();
  }

  handleError(err) {
    handleRequestError(err, this.req, this.res, Object.assign({
      title: "Error occurred in WebProxy"
    }, this.options.errOpts));
  }

  handleReqError(err) {
    this.abort();
    this.handleError(err);
  }

  resetTimeout(clientReq) {
    clientReq.removeAllListeners("timeout");
    clientReq.setTimeout(0);
  }

  getProxyReqHeaders() {
    function _getAddress() {
      const prefix = "::ffff:";
      let addr = req.socket.remoteAddress;
      if (addr.startsWith(prefix))
        addr = addr.substr(prefix.length);
      return addr;
    }

    function _isEncrypted() {
      return req.connection.encrypted;
    }

    function _getPort() {
      const m = req.headers.host ? req.headers.host.match(/:(\d+)/) : "";
      return m ? m[1] : (_isEncrypted(req) ? "443" : "80");
    }

    const reqOpts = this.reqOpts;
    const xff = this.options.xff;
    const req = this.req;
    const headers = new ProxyHeaders(req).set(reqOpts.headers);

    if (xff === undefined || xff) {
      const value = headers.get("x-forwarded-for");

      headers.set("x-forwarded-for", (value || "") + (value ? ", " : "") + _getAddress());

      if (!headers.get("x-forwarded-proto"))
        headers.set("x-forwarded-proto", _isEncrypted() ? "https" : "http");

      if (!headers.get("x-forwarded-port"))
        headers.set("x-forwarded-port", _getPort());

      if (!headers.get("x-forwarded-host"))
        headers.set("x-forwarded-host", headers.get("host") || "");
    }

    return headers;
  }

  getProxyResHeaders() {
    return new ProxyHeaders(this.proxyRes);
  }

  handleProxyReq() {
    const req = this.req;
    const proxyReq = this.proxyReq;
    if (this.options.ignoreReqBody) {
      req.resume();
      proxyReq.end();
    } else {
      pump(req, proxyReq, err => {
        if (err)
          this.handleError(err);
      });
    }
  }

  handleProxyRes() {
    const res = this.res;
    const proxyRes = this.proxyRes;
    const headers = this.getProxyResHeaders();

    headers.copyTo(res);

    res.statusCode = proxyRes.statusCode;
    res.statusMessage = proxyRes.statusMessage;

    pump(proxyRes, res, err => {
      if (err)
        this.handleError(err);
    });
  }

  handleConnection() {
    // Once the socket is assigned and connected, we turn off the
    // timeout because it is an opaque agreement between the client
    // and target from the proxy's view point.
    // To detect the silent network cutoff, you should depend on the
    // keep-alive probes set by the agent.
    this.resetTimeout(this.proxyReq);
    this.handleProxyReq();
  }

  initReq() {
    const req = this.req;
    req.on("error", err => this.handleReqError(err));
    req.on("aborted", () => this.handleReqError(error(REQUEST_ABORTED)));
  }

  initProxyReq() {
    const proxyReq = this.proxyReq;
    proxyReq.on("error", err => this.handleError(err));
    proxyReq.on("socket", socket => {
      if (!(socket.connecting || socket._connecting))
        this.handleConnection();
      else
        socket.once("connect", () => this.handleConnection());
    });
    proxyReq.on("response", proxyRes => {
      this.proxyRes = proxyRes;
      this.handleProxyRes();
    });
  }

  handle(req, res, target) {
    this.req = req;
    this.res = res;
    this.reqOpts = getReqOpts(target);
    this.initReqOpts();
    this.createProxyReq();
    this.initReq();
    this.initProxyReq();
  }
}

module.exports = WebProxy;
