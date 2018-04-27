"use strict";

const getAwsService = require("@gourmet/get-aws-service");

const lambda = getAwsService("Lambda");

lambda.invoke({
  FunctionName: "react-hello-ui-dev-render",
  InvocationType: "RequestResponse",
  LogType: "Tail",
  Payload: JSON.stringify({
    entrypoint: "main",
    siloed: false,
    params: {
      a: 1,
      b: 2
    }
  })
}).promise().then(data => {
  function _print(name) {
    const value = data[name];
    console.log(name + ":", value);
  }

  function _base64(input) {
    return Buffer.from(input, "base64").toString();
  }

  _print("StatusCode");
  _print("FunctionError");
  _print("Payload");
  _print("ExecutedVersion");

  if (data.LogResult)
    _print(_base64(data.LogResult));
}).catch(err => {
  console.error(err);
});
