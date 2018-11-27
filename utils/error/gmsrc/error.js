"use strict";

const template = require("lodash.template");

function error(def, ...args) {
  const props = Object.assign({}, def, ...args);
  const message = template(props.message || "Error")(props);
  let ErrorClass;

  if (props.ErrorClass) {
    ErrorClass = props.ErrorClass;
    delete props.ErrorClass;
  } else {
    ErrorClass = Error;
  }

  const err = new ErrorClass(message);

  for (const name in props) {
    if (name !== "message")
      err[name] = props[name];
  }

  return err;
}

module.exports = error;
