"use strict";

class HttpHeaders {
  constructor() {
    this._caseMap = {};
    this._headers = {};
  }

  get(name) {
    return this._headers[name];
  }

  // If `name` is `set-cookie`, value is converted to an array and appended
  // to the existing value. Otherwise, any existing value is replaced.
  set(name, value) {
    if (typeof name === "object") {
      const headers = name;
      for (const name in headers) {
        if (headers.hasOwnProperty(name))
          this.set(name, headers[name]);
      }
    } else if (name && value) {
      const key = name.toLowerCase();
      if (key === "set-cookie") {
        let current = this._headers[key];
        if (current) {
          if (!Array.isArray(current))
            current = [current];
          value = current.concat(value);
        } else if (!Array.isArray(value)) {
          value = [value];
        }
      }
      this._headers[key] = value;
      this._caseMap[key] = name;
    }
    return this;
  }

  setFromRawHeaders(headers, rawHeaders) {
    for (let idx = 0; idx < rawHeaders.length; idx += 2) {
      const name = rawHeaders[idx];
      this._caseMap[name.toLowerCase()] = name;
    }

    for (const key in headers) {
      if (headers.hasOwnProperty(key))
        this._headers[key] = headers[key];
    }

    return this;
  }

  // Returns an object with lowercased names
  getHeaders() {
    return Object.assign({}, this._headers);
  }

  // Returns an object with original names
  getHeadersCase() {
    const srcHeaders = this._headers;
    const caseMap = this._caseMap;
    const headers = {};
    for (const key in srcHeaders) {
      if (srcHeaders.hasOwnProperty(key))
        headers[caseMap[key]] = srcHeaders[key];
    }
    return headers;
  }

  copyTo(message) {
    const headers = this.getHeadersCase();
    Object.keys(headers).forEach(name => {
      const value = headers[name];
      message.setHeader(name, value);
    });
  }

  // Removes all headers specified in `keys` (array or object of lowercase
  // names) from the `headers` and returns a new object.
  static remove(headers, keys) {
    if (Array.isArray(keys)) {
      keys = keys.reduce((obj, key) => {
        obj[key] = true;
        return obj;
      }, {});
    }

    const resHeaders = {};
    for (const name in headers) {
      if (headers.hasOwnProperty(name) && !keys[name.toLowerCase()])
        resHeaders[name] = headers[name];
    }

    return resHeaders;
  }
}

module.exports = HttpHeaders;
