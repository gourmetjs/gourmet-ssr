"use strict";

const isPlainObject = require("@gourmet/is-plain-object");

module.exports = function omit(src, props) {
  if (isPlainObject(src)) {
    if (typeof props === "string")
      props = [props];
    return Object.keys(src).reduce((obj, name) => {
      if (props.indexOf(name) === -1)
        obj[name] = src[name];
      return obj;
    }, {});
  }
  return src;
};
