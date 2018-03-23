"use strict";

const ReactDOMServer = require("react-dom/server");
const HtmlServerRenderer = require("@gourmet/html-renderer/lib/HtmlServerRenderer");

// Options:
//  - reactServerRender: "string", "static_markup", "stream", "static_stream"
module.exports = class ReactServerRenderer extends HtmlServerRenderer {
  renderToMedium(gmctx, element) {
    if (!element)
      return null;

    let bodyMain;

    switch (this.options.reactServerRender || "stream") {
      case "string":
        bodyMain = ReactDOMServer.renderToString(element);
        gmctx.data.reactClientRender = "hydrate";
        break;
      case "static_markup":
        bodyMain = ReactDOMServer.renderToStaticMarkup(element);
        break;
      case "stream":
        bodyMain = ReactDOMServer.renderToNodeStream(element);
        gmctx.data.reactClientRender = "hydrate";
        break;
      case "static_stream":
        bodyMain = ReactDOMServer.renderToStaticNodeStream(element);
        break;
      default:
        throw Error("Unknown reactServerRender: " + this.options.reactServerRender);
    }

    return bodyMain;
  }
};
