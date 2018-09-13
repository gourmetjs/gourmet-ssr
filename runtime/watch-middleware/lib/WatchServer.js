"use strict";

const STATS = {
  all: false,
  warnings: true,
  errors: true,
  errorDetails: false
};

// https://github.com/webpack/webpack/blob/1f954b4f1281f2bb97492fcd911d270efb097fd5/lib/Stats.js#L270
function _formatError(err) {
  let text = "";
  if (typeof err === "string")
    err = {message: err};
  if (err.file)
    text += `${err.file}\n`;
  text += err.message;
  if (err.details)
    text += `\n${err.details}`;
  return text;
}

module.exports = class WatchServer {
  constructor(/*options*/) {
  }

  // {error, stats, changed}
  notify(server, client) {
    if (server.error || client.error) {
      this.broadcast("errors", {
        server: server.error ? [_formatError(server.error)] : [],
        client: client.error ? [_formatError(client.error)] : []
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
    console.log(`BROADCAST: ${type}`, data);
  }
};
