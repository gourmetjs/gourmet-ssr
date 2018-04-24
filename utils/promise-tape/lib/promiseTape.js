"use strict";

module.exports = function promiseTape(fn) {
  return function(t) {
    fn(t).then(() => t.end(), t.end);
  };
};
