"use strict";

const {renderStylesToString, renderStylesToNodeStream} = require("emotion-server");

module.exports = function getEmotionServerRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/emotion-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  return class EmotionServerRenderer extends Base {
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
  };
};
