"use strict";

const WebSocket = require("ws");
const stripAnsi = require("strip-ansi");
const escapeHtml = require("escape-html");
const errorToString = require("@gourmet/error-to-string");

const STATS = {
  all: false,
  hash: true,
  assets: false,
  warnings: true,
  errors: true,
  errorDetails: false
};

function _formatError(err) {
  return escapeHtml(stripAnsi(errorToString(err)));
}

module.exports = class WatchServer {
  constructor(options, con) {
    const wss = this._wss = new WebSocket.Server(options);

    wss.on("connection", socket => {
      con.log(`[watch] client connected (${wss.clients.size})`);

      socket.on("error", err => {
        if (err.code !== "ECONNRESET")
          con.warn("[watch] socket error", _formatError(err));
      });

      socket.on("close", () => {
        con.log(`[watch] client disconnected (${wss.clients.size})`);
      });

      this.send(socket, "init", this._state);
    });

    wss.on("error", err => {
      con.error("[watch] cannot start WebSocket server", con.colors.brightRed(_formatError(err)));
    });

    wss.on("listening", () => {
      const {port} = wss._server.address();
      con.log(`[watch] WebSocket server listening on port ${port}`);
    });
  }

  // {error, stats}
  notify(server, client) {
    const err = client.error || server.error;

    if (err) {
      this._state = {
        error: _formatError(err)
      };
    } else {
      const serverStats = server.stats.toJson(STATS);
      const clientStats = client.stats.toJson(STATS);
      const err = clientStats.errors[0] || serverStats.errors[0];
      this._state = {
        error: err ? _formatError(err) : undefined,
        hash: serverStats.hash + ":" + clientStats.hash
      };
    }

    this.broadcast("done", this._state);
  }

  broadcast(type, data) {
    const payload = JSON.stringify({type, data});
    for (const client of this._wss.clients) {
      if (client.readyState === WebSocket.OPEN)
        client.send(payload);
    }
  }

  send(client, type, data) {
    const payload = JSON.stringify({type, data});
    client.send(payload);
  }
};
