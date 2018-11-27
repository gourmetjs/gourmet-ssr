"use strict";

const React = require("react");
const GourmetContext = require("@gourmet/react-context-gmctx");

module.exports = function wrapWithContext(gmctx, element) {
  return React.createElement(
    GourmetContext.Provider,
    {value: gmctx},
    element
  );
};
