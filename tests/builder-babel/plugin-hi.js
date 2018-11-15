"use strict";

module.exports = function babelPlugin({types: t}) {
  return {
    visitor: {
      Literal(path) {
        if (path.node.value === "Hello, world!")
          path.replaceWith(t.stringLiteral("Hi, world!"));
      }
    }
  };
};
