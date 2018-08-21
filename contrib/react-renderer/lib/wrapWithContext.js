"use strict";

const React = require("react");
const ReactContext = require("@gourmet/react-context-gmctx");

module.exports = function wrapWithContext(gmctx, element) {
  return React.createElement(
    ReactContext.Provider,
    {value: gmctx},
    element
  );
};
