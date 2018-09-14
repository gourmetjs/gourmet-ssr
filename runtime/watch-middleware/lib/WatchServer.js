"use strict";

const WebSocket = require("ws");
const errorToString = require("@gourmet/error-to-string");

const STATS = {
  all: false,
  warnings: true,
  errors: true,
  errorDetails: false
};

module.exports = class WatchServer {
  constructor(options, con) {
    const wss = this._wss = new WebSocket.Server(options);

    wss.on("connection", socket => {
      con.info(`[watch] client connected (${wss.clients.size})`);

      socket.on("error", err => {
        if (err.code !== "ECONNRESET")
          con.warn("[watch] socket error", errorToString(err));
      });

      socket.on("message", data => {
        const payload = JSON.parse(data);

        if (payload.type === "broadcast")
          this.broadcast(payload.data.type, payload.data.data);
        else
          con.warn(`[watch] invalid client request: ${payload.type}`);
      });
    });

    wss.on("error", err => {
      con.error("[watch] cannot start WebSocket server", con.colors.brightRed(errorToString(err)));
    });

    wss.on("listening", () => {
      const {port} = wss._server.address();
      con.log(`[watch] WebSocket server listening on port ${port}`);
    });
  }

  // {error, stats, changed}
  notify(server, client) {
    if (server.error || client.error) {
      this.broadcast("errors", {
        server: server.error ? [errorToString(server.error)] : [],
        client: client.error ? [errorToString(client.error)] : []
      });
    } else {
      const serverStats = server.stats.toJson(STATS);
      const clientStats = client.stats.toJson(STATS);

      if (serverStats.errors.length || clientStats.errors.length) {
        this.broadcast("errors", {
          server: serverStats.errors,
          client: clientStats.errors
        });
      } else if (serverStats.warnings.length || clientStats.warnings.length) {
        this.broadcast("warnings", {
          server: serverStats.warnings,
          client: clientStats.warnings
        });
      } else {
        if (server.changed || client.changed)
          this.broadcast("reload");
      }
    }
  }

  broadcast(type, data) {
    const payload = JSON.stringify({type, data});
    for (const client of this._wss.clients) {
      if (client.readyState === WebSocket.OPEN)
        client.send(payload);
    }
  }
};
