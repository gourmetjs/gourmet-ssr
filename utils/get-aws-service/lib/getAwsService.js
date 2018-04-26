"use strict";

const AWS = require("aws-sdk");

// getAwsService("SQS", {AWS: {"region": "us-west-2"}})
//  => `AWS` for all services
// getAwsService("SQS", {AWS: {"region": "us-west-2"}, SQS: {sslEnabled: false}})
//  => `className` for service-specific options (`Object.assign`ed with `AWS`)
// getAwsService("SQS", {instance: {SQS: new MockSQS()}})
//  => `instance[className]` for using the provided service object
function getAwsService(className, options={}) {
  const aws = options.aws;
  let serviceOptions;
  if (typeof aws === "object") {
    const service = options.instance && options.instance[className];
    if (service)
      return service;
    serviceOptions = Object.assign({}, aws.options, aws[name]);
  }
  return new AWS[className](serviceOptions);
}

getAwsService.AWS = AWS;

module.exports = getAwsService;
