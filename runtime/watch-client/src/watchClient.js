"use strict";

function _run({serverUrl, reconnect}, handler) {
  function _connect() {
    const socket = new WebSocket(serverUrl);

    socket.addEventListener("open", () => {
      retry = 0;
      console.info("[watch] connected");
    });

    // It appears that "close" comes even without "open" for the initial failure.
    // This behavior is observed in Chrome, Edge & Firefox.
    socket.addEventListener("close", () => {
      console.info("[watch] closed");

      if (reconnect === undefined || reconnect) {
        const delay = Math.round(1000 * Math.pow(Math.min(retry++, 8), 2) + Math.random() * 100);
        setTimeout(() => {
          console.info(`[watch] retrying (${retry} / ${delay}ms)`);
          _connect();
        }, delay);
      }
    });

    socket.addEventListener("message", event => {
      const payload = JSON.parse(event.data);
      handler(payload.type, payload.data);
    });
  }

  let retry = 0;

  _connect();
}

if (!window.__GOURMET_WATCH_INIT__) {
  window.__GOURMET_WATCH_INIT__ = true;

  // @gourmet/plugin-watch-client will define this free variable.
  const options = __GOURMET_WATCH_OPTIONS__;  // eslint-disable-line no-undef

  _run(options, (type, data) => {
    if (type === "reload") {
      const delay = (data && data.delay) || 0;
      setTimeout(() => {
        console.info("[watch] reloading page");
        window.location.reload();
      }, delay);
    }
  });
}
