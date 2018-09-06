"use strict";

const handleRequestError = require("@gourmet/handle-request-error");

module.exports = function errorMiddleware(options) {
  return (err, req, res, next) => {  // eslint-disable-line no-unused-vars
    handleRequestError(err, req, res, options);
  };
};
