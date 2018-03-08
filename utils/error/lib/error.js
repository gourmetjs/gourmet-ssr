"use strict";

const template = require("lodash.template");

function error(def, ...args) {
  const props = Object.assign({}, def, ...args);
  const message = template(props.message || "Error")(props);
  const err = new Error(message);
  for (const name in props) {
    if (name !== "message")
      err[name] = props[name];
  }
  return err;
}

module.exports = error;
