"use strict";

const template = require("lodash.template");

const INTERPOLATE_RE = /{{(\w[\w.]*)}}/g;

module.exports = function resolveTemplate(value, defaultTemplate) {
  if (typeof value === "function") {
    return value;
  } else if (typeof value === "string") {
    return template(value, {interpolate: INTERPOLATE_RE});
  } else {
    return template(defaultTemplate, {interpolate: INTERPOLATE_RE});
  }
};
