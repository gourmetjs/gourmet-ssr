"use strict";

// unprefixPath("/abc/def", "/abc") ==> "/def"
// unprefixPath("/abc/def", "/abc/") ==> "/def"
// unprefixPath("/abc", "/abc") ==> "/"
// unprefixPath("/abc", "/def") ==> null
exports.unprefixPath = function(path, prefix) {
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

// Parse a URL string into the following parts:
// - origin: protocol + auth + host + port ("http://user:pw@www.example.com:8080", "//example.com", "")
// - path: path string ("/hello", "../foo/bar", "test", "/") - no relative path resolution, `decodeURI()`ed
// - search: encoded query string ("?a=1&b", "")
// - hash: fragment  ("#bookmark", "")
exports.parseUrl = function(href) {
  const parts = [];
  let spos = 0;

  const remaining = ["/", "?", "#"].every(ch => {
    let idx, offset = 0;

    if (ch === "/") {
      if (href.startsWith("//")) {
        offset = 2;
      } else if ((idx = href.indexOf("://")) !== -1) {
        offset = idx + 3;
      } else {
        parts.push("");
        return true;
      }
    }

    idx = href.indexOf(ch, spos + offset);

    if (idx === -1) {
      parts.push(href.substr(spos));
      return false;   // exit loop
    } else {
      parts.push(href.substring(spos, idx));
      spos = idx;
      return true;
    }
  });

  if (remaining)
    parts.push(href.substr(spos));

  return {
    origin: parts[0] || "",
    path: decodeURI(parts[1] || "/"),
    search: parts[2] || "",
    hash: parts[3] || "",
    href
  };
};

exports.joinPath = function(items) {
  return items.map((item, idx) => {
    const prev = items[idx - 1];
    if (!prev || prev[prev.length - 1] !== "/") {
      if (item[0] !== "/")
        item = "/" + item;
    }
    return item;
  }).join("");
};

// Simple and slow query string parser focusing on small code size
function _qs(search) {
  if (search[0] === "?")
    search = search.substr(1);
  return search.split("&").reduce((query, item) => {
    const [key, value] = item.split("=");
    query[decodeURIComponent(key)] = decodeURIComponent(value || "");
    return query;
  }, {});
}


exports.encodeQuery = function(query) {
  if (!query)
    return "";
  Object.keys(query).map(name => {
    value = query[name];
  });
};
