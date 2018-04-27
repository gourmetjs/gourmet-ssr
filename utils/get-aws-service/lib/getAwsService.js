"use strict";

const AWS = require("aws-sdk");

// getAwsService("SQS", {AWS: {"region": "us-west-2"}})
//  => `AWS` for all services
// getAwsService("SQS", {AWS: {"region": "us-west-2"}, SQS: {sslEnabled: false}})
//  => `className` for service-specific options (`Object.assign`ed with `AWS`)
// getAwsService("SQS", {awsServiceInstance: {SQS: new MockSQS()}})
//  => `instance[className]` to use the provided service object instead
function getAwsService(className, options) {
  let serviceOptions;
  if (typeof options === "object") {
    const service = options.awsServiceInstance && options.awsServiceInstance[className];
    if (service)
      return service;
    serviceOptions = Object.assign({}, options.AWS, options[className]);
  }
  return new AWS[className](serviceOptions);
}

getAwsService.AWS = AWS;

module.exports = getAwsService;
