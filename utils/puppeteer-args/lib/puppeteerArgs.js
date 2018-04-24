"use strict";

const parseArgs = require("@gourmet/parse-args");

module.exports = {
  headless: parseArgs.bool(process.env.TEST_HEADLESS, true),
  slowMo: parseArgs.number(process.env.TEST_SLOWMO, 0)
};
