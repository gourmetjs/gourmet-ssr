"use strict";

const HttpHeaders = require("@gourmet/http-headers");

// Hop-by-hop headers to exclude when proxying websocket connections
const WEBSOCKET_EXCLUDE = {
  "keep-alive": true,
  "public": true,
  "proxy-authenticate": true,
  "transfer-encoding": true
};

// Hop-by-hop headers to exclude when proxying regular requests
const REQUEST_EXCLUDE = {
  "keep-alive": true,
  "public": true,
  "proxy-authenticate": true,
  "transfer-encoding": true,
  "connection": true,
  "upgrade": true
};

class ProxyHeaders extends HttpHeaders {
  // `message` is `http.IncomingMessage` which is either `req` or `proxyRes`.
  constructor(message, isWebSocket) {
    super();

    this.setFromRawHeaders(
      HttpHeaders.remove(message.headers, isWebSocket ? WEBSOCKET_EXCLUDE : REQUEST_EXCLUDE),
      message.rawHeaders
    );
  }
}

module.exports = ProxyHeaders;
