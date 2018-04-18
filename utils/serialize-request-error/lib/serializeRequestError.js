"use strict";

const serializeError = require("@gourmet/serialize-error");

module.exports = function serializeRequestError(req, err, options={}) {
  const obj = serializeError(err);
  const props = options.requestProps || ["url", "method", "headers"];
  const copied = {};

  for (let idx = 0; idx < props.length; idx++) {
    const name = props[idx];
    const value = req[name];
    if (value !== undefined)
      copied[name] = value;
  }

  obj.req = copied;

  return obj;
};
