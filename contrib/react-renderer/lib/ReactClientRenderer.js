"use strict";

const ReactDOM = require("react-dom");
const HtmlClientRenderer = require("@gourmet/html-renderer/lib/HtmlClientRenderer");
const registrar = require("@gourmet/loadable-registrar");
const wrapWithContext = require("./wrapWithContext");

module.exports = class ReactClientRenderer extends HtmlClientRenderer {
  invokeUserRenderer(gmctx) {
    return super.invokeUserRenderer(gmctx).then(element => {
      return wrapWithContext(gmctx, element);
    });
  }

  renderToDom(gmctx, content, elemId) {
    return registrar.load(gmctx.data.renderedLoadables || []).then(() => {
      const parent = document.getElementById(elemId);
      if (gmctx.data.reactClientRender === "hydrate")
        ReactDOM.hydrate(content, parent);
      else
        ReactDOM.render(content, parent);
    });
  }
};
