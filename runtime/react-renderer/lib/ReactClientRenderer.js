"use strict";

const ReactDOM = require("react-dom");
const HtmlClientRenderer = require("@gourmet/html-renderer/lib/HtmlClientRenderer");

module.exports = class ReactClientRenderer extends HtmlClientRenderer {
  renderToDom(gmctx, content, elemId) {
    const parent = document.getElementById(elemId);
    if (gmctx.data.reactClientRender === "hydrate")
      ReactDOM.hydrate(content, parent);
    else
      ReactDOM.render(content, parent);
  }
};
