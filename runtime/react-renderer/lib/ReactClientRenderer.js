"use strict";

const ReactDOM = require("react-dom");
const HtmlClientRenderer = require("@gourmet/html-renderer/lib/HtmlClientRenderer");
const registrar = require("@gourmet/loadable-registrar");
const provideContext = require("./provideContext");

module.exports = class ReactClientRenderer extends HtmlClientRenderer {
  renderToDom(gmctx, content, elemId) {
    content = provideContext(gmctx, content);
    return registrar.load(gmctx.data.renderedLoadables || []).then(() => {
      const parent = document.getElementById(elemId);
      if (gmctx.data.reactClientRender === "hydrate")
        ReactDOM.hydrate(content, parent);
      else
        ReactDOM.render(content, parent);
    });
  }
};
