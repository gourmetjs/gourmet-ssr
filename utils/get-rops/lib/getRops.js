"use strict";

const nurl = require("url");
const isPlainObject = require("@gourmet/is-plain-object");

function _toPojo(src) {
  const obj = ["protocol", "hostname", "port"].reduce((obj, name) => {
    if (src[name] !== undefined)
      obj[name] = src[name];
    return obj;
  }, {});
  if (typeof src.path === "string")
    obj.path = src.path;
  else
    obj.path = (src.pathname || "/") + (src.search || "");
  return obj;
}

module.exports = function getRops(url) {
  if (typeof url === "string")
    return _toPojo(nurl.parse(url, false, true));
  else if (isPlainObject(url))
    return Object.assign({}, url);
  else if (typeof url === "object")
    return _toPojo(url);  // assume this is Node's 'Url' compatible
  else
    throw Error("Invalid url. Must be a string or object");
};
