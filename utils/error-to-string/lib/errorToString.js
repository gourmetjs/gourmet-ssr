"use strict";

module.exports = function errorToString(err) {
  if (!err)
    return "No error";

  if (typeof err === "string")
    return err;

  return err.stack || err.message || err.toString();
};
