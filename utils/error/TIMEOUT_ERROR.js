"use strict";

const TIMEOUT_ERROR = {
  message: "Operation timed out",
  code: "ETIMEDOUT",
  statusCode: 408
};

module.exports = TIMEOUT_ERROR;
