"use strict";

const {renderStylesToString, renderStylesToNodeStream} = require("emotion-server");

module.exports = function getEmotionServerRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/emotion-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  return class EmotionServerRenderer extends Base {
    renderToMedium(gmctx, element) {
      element = super.renderToMedium(gmctx, element);

      if (element) {
        if (typeof element === "string")
          return renderStylesToString(element);
        else
          return element.pipe(renderStylesToNodeStream());
      }

      return element;
    }
  };
};
