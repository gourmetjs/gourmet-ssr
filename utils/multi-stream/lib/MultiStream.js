"use strict";

const stream = require("stream");

// This class is based on `https://github.com/feross/multistream`.
// Differences from the original are:
//  - Modern ES6 class syntax
//  - Using standard Node built-in modules
//  - Simpler API
module.exports = class MultiStream extends stream.Readable {
  constructor(streams, options) {
    super(options);

    this.destroyed = false;

    this._drained = false;
    this._forwarding = false;
    this._current = null;

    this._queue = streams;
    this._queue.forEach(stream => {
      if (typeof stream !== "function")
        this._attachErrorListener(stream);
    });

    this._next();
  }

  _read() {
    this._drained = true;
    this._forward();
  }

  _forward() {
    if (this._forwarding || !this._drained || !this._current)
      return;

    this._forwarding = true;

    let chunk;
    while ((chunk = this._current.read()) !== null) {
      this._drained = this.push(chunk);
    }

    this._forwarding = false;
  }

  destroy(err) {
    if (this.destroyed)
      return;

    this.destroyed = true;

    if (this._current && this._current.destroy)
      this._current.destroy();

    this._queue.forEach(stream => {
      if (stream.destroy)
        stream.destroy();
    });

    if (err)
      this.emit("error", err);

    this.emit("close");
  }

  _next() {
    this._current = null;
    let stream = this._queue.shift();
    if (typeof stream === "function") {
      stream = stream();
      this._attachErrorListener(stream);
    }
    this._gotNextStream(stream);
  }

  _gotNextStream(stream) {
    if (!stream) {
      this.push(null);
      this.destroy();
      return;
    }

    const onReadable = () => {
      this._forward();
    };

    const onClose = () => {
      if (!stream._readableState.ended)
        this.destroy();
    };

    const onEnd = () => {
      this._current = null;
      stream.removeListener("readable", onReadable);
      stream.removeListener("end", onEnd);
      stream.removeListener("close", onClose);
      this._next();
    };

    this._current = stream;
    this._forward();

    stream.on("readable", onReadable);
    stream.once("end", onEnd);
    stream.once("close", onClose);

  }

  _attachErrorListener(stream) {
    if (!stream)
      return;

    const onError = err => {
      this.destroy(err);
    };

    stream.once("error", onError);
  }
};
