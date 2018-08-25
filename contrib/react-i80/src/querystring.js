"use strict";

// Simple and slow query string parser focusing on small code size
module.exports = function querystring(search) {
  if (search[0] === "?")
    search = search.substr(1);
  return search.split("&").reduce((query, item) => {
    const [key, value] = item.split("=");
    query[decodeURIComponent(key)] = decodeURIComponent(value || "");
    return query;
  }, {});
};
