"use strict";

const ReactDOM = require("react-dom");
const HtmlClientRenderer = require("@gourmet/html-renderer/lib/HtmlClientRenderer");
const registrar = require("@gourmet/loadable-registrar");
const provideContext = require("./provideContext");

module.exports = class ReactClientRenderer extends HtmlClientRenderer {
  invokeUserRenderer(gmctx) {
    return registrar.load(gmctx.data.renderedLoadables || []).then(() => {
      return super.invokeUserRenderer(gmctx).then(element => {
        return provideContext(gmctx, element);
      });
    });
  }

  renderToDom(gmctx, content, elemId) {
    const parent = document.getElementById(elemId);
    if (gmctx.data.reactClientRender === "hydrate")
      ReactDOM.hydrate(content, parent);
    else
      ReactDOM.render(content, parent);
  }
};
