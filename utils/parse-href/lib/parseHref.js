"use strict";

// Parse a URL string into the following parts:
// - origin: protocol + auth + host + port ("http://user:pw@www.example.com:8080", "//example.com", "")
// - path: path string ("/hello", "../foo/bar", "test", "/") - no relative path resolution, `decodeURI()`ed
// - search: encoded query string ("?a=1&b", "")
// - hash: fragment  ("#bookmark", "")
module.exports = function parseHref(href) {
  const parts = [];
  let spos = 0;

  ["/", "?", "#"].forEach(ch => {
    let idx, offset = 0;

    if (ch === "/") {
      if (href.startsWith("//")) {
        offset = 2;
      } else if ((idx = href.indexOf("://")) !== -1) {
        offset = idx + 3;
      } else {
        parts.push("");
        return;
      }
    }

    idx = href.indexOf(ch, spos + offset);

    if (idx !== -1) {
      parts.push(href.substring(spos, idx));
      spos = idx;
    }
  });

  const remaining = href.substr(spos);

  if (remaining) {
    const ch = remaining[0];
    const idx = (ch === "?" ? 2 : (ch === "#" ? 3 : parts.length));
    parts[idx] = remaining;
  }

  return {
    origin: parts[0] || "",
    path: decodeURI(parts[1] || "/"),
    search: parts[2] || "",
    hash: parts[3] || "",
    href
  };
};
