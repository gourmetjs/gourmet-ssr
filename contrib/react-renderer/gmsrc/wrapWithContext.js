"use strict";

const React = require("react");
const GourmetContext = require("@gourmet/react-context-gmctx");

module.exports = function wrapWithContext(renderer, gmctx, element) {
  return (
    <GourmetContext.Provider value={gmctx}>
      <div {...renderer.makeRootProps(gmctx)}>
        {element}
      </div>
    </GourmetContext.Provider>
  );
};
