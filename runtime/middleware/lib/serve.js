"use strict";

const merge = require("@gourmet/merge");
const getReqArgs = require("@gourmet/get-req-args");
const sendContent = require("@gourmet/send-content");

module.exports = function(gourmet) {
  return function(req, res, next) {
    res.serve = function(page, clientProps, context) {
      context = merge({clientProps, reqArgs: getReqArgs(req)}, context);
      gourmet.invoke({page, context}, (err, result) => {
        if (err) {
          next(err);
        } else if (!result) {
          next();
        } else {
          sendContent(res, result, err => {
            if (err)
              next(err);
          });
        }
      });
    };
    next();
  };
};
