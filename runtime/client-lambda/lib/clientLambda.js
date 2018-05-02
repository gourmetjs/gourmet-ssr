"use strict";

const merge = require("@gourmet/merge");
const omit = require("@gourmet/omit");
const error = require("@gourmet/error");
const getReqArgs = require("@gourmet/get-req-args");
const getAwsService = require("@gourmet/get-aws-service");
const sendContent = require("@gourmet/send-content");

const LAMBDA_FUNCTION_ERROR = {
  message: "${errorMessage}"
};

const LAMBDA_PAYLOAD_ERROR = {
  message: "Lambda function returned unrecognizable result: ${payload}"
};

const _defaultLambda = getAwsService("Lambda");

function clientLambda(baseArgs) {
  function invoke(args, callback) {
    args = merge.intact(baseArgs, args);
    const {lambda=_defaultLambda, functionName, qualifier} = args;
    args = omit(args, ["lambda", "functionName", "qualifier"]);

    if (!functionName)
      throw Error("'functionName' is required");

    lambda.invoke({
      FunctionName: functionName,
      Qualifier: qualifier,
      InvocationType: "RequestResponse",
      LogType: "None",
      Payload: JSON.stringify(args)
    }, (err, data) => {
      if (err)
        return callback(err);

      let payload;

      try {
        payload = JSON.parse(data.Payload);
      } catch (err) {
        return callback(error(LAMBDA_PAYLOAD_ERROR, {payload: data.Payload}));
      }

      if (data.FunctionError === "Unhandled")
        return callback(error(LAMBDA_FUNCTION_ERROR, {code: "LAMBDA_UNHANDLED_ERROR", functionName}, payload));
      else if (data.FunctionError === "Handled")
        return callback(error(LAMBDA_FUNCTION_ERROR, {code: "LAMBDA_HANDLED_ERROR", functionName}, payload));

      callback(null, payload);
    });
  }

  function render(req, res, next, args) {
    args = Object.assign(getReqArgs(req), args);
    invoke(args, (err, result) => {
      if (err) {
        next(err);
      } else {
        sendContent(res, result, err => {
          if (err)
            next(err);
        });
      }
    });
  }

  function renderer(args) {
    return function(req, res, next) {
      render(req, res, next, args);
    };
  }

  function context(args) {
    return clientLambda(args);
  }

  context.invoke = invoke;
  context.render = render;
  context.renderer = renderer;

  return context;
}

module.exports = clientLambda();
