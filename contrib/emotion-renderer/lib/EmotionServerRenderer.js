"use strict";

const {renderStylesToString, renderStylesToNodeStream} = require("emotion-server");
const ReactServerRenderer = require("@gourmet/react-renderer/lib/ReactServerRenderer");

class EmotionServerRenderer extends ReactServerRenderer {
  renderToMedium(gmctx, element) {
    const bodyMain = super.renderToMedium(gmctx, element);

    if (bodyMain) {
      if (typeof bodyMain === "string")
        return renderStylesToString(bodyMain);
      else
        return bodyMain.pipe(renderStylesToNodeStream());
    }

    return bodyMain;
  }
}

module.exports = EmotionServerRenderer;
