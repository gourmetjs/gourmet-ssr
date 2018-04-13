"use strict";

const AWS = require("aws-sdk");

// getAwsService("sqs", "SQS", {aws: {options: {"region": "us-west-2"}}})
//  => `aws.options` for all services
// getAwsService("sqs", "SQS", {aws: {options: {"region": "us-west-2"}, sqs: {sslEnabled: false}}})
//  => `aws[name]` for service-specific options (`Object.assign`ed with `aws.options`)
// getAwsService("sqs", "SQS", {aws: {serviceInstance: {sqs: new MockSQS()}}})
//  => `aws.serviceInstance[name]` for using the provided service object
function getAwsService(name, className, options={}) {
  const aws = options.aws;
  let serviceOptions;
  if (typeof aws === "object") {
    const service = aws.serviceInstance && aws.serviceInstance[name];
    if (service)
      return service;
    serviceOptions = Object.assign({}, aws.options, aws[name]);
  }
  return new AWS[className](serviceOptions);
}

getAwsService.AWS = AWS;

module.exports = getAwsService;
