"use strict";

// unprefixPath("/abc/def", "/abc") ==> "/def"
// unprefixPath("/abc/def", "/abc/") ==> "/def"
// unprefixPath("/abc", "/abc") ==> "/"
// unprefixPath("/abc", "/def") ==> null
module.exports = function unprefixPath(path, prefix) {
  const len = prefix.length;

  if (len && prefix !== "/") {
    if (path.indexOf(prefix) !== 0)
      return null;
    if (len >= path.length)
      return "/";
    if (path[len] === "/")
      return path.substr(len);
    if (path[len - 1] === "/")
      return path.substr(len - 1);
    return null;
  }

  return path;
};

