"use strict";

module.exports = function getExported(obj, name) {
  return name ? obj[name] : (obj && obj.__esModule ? obj.default : obj);
};
