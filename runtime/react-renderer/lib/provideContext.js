"use strict";

const React = require("react");
const GourmetContextProvider = require("../src/GourmetContextProvider");

module.exports = function provideContext(gmctx, element) {
  return React.createElement(
    GourmetContextProvider,
    {gmctx},
    element
  );
};
