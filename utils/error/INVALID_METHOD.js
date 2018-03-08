"use strict";

const INVALID_METHOD = {
  message: "Method not allowed: ${method}",
  code: "INVALID_METHOD",
  statusCode: 405
};

module.exports = INVALID_METHOD;
