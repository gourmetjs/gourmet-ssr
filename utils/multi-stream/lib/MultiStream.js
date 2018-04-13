"use strict";

const {Readable} = require("stream");
const isStream = require("@gourmet/is-stream");

class MultiStream extends Readable {
  constructor(items, options) {
    super(options);
    this._items = items || [];
    this._current = null;

    if (!Readable.prototype.destroy)
      
  }

  _read(size) {
    let item = this._current;
    if (!item) {
      item = this._shiftItem();
      if (isStream(item)) {
        this._current = item;
        item.on("readable", () => {
          this._pumpStream(item, size);
        }).on("end", () => {
          this._current = null;
          setImmediate(() => {
            this._read(size);
          });
        }).on("error", err => {
          this.emit("error", err);
        });
      } else {
        this._pumpBuffer(item, size);
      }
    } else {
      this._pumpStream(item, size);
    }
  }

  _pumpStream(stream, size) {
    for (;;) {
      const buf = stream.read(size);
      if (!buf)
        break;
      if (!this.push(buf))
        break;
    }
  }

  _pumpBuffer(buf, size) {
    for (;;) {
      if (buf == null) {
        this.push(null);
        break;
      }
      if (!this.push(buf))
        break;
      buf = this._shiftItem();
      if (isStream(buf)) {
        this._items.unshift(buf);
        setImmediate(() => {
          this._read(size);
        });
        break;
      }
    }
  }

  _shiftItem() {
    const item = this._items.shift();
    if (typeof item === "function")
      return item();
    else
      return item;
  }
}

module.exports = MultiStream;
