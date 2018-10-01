"use strict";

const {renderStylesToString, renderStylesToNodeStream} = require("emotion-server");
const pump = require("pump");

module.exports = function getEmotionServerRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/emotion-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  return class EmotionServerRenderer extends Base {
    renderToMedium(gmctx, element) {
      element = super.renderToMedium(gmctx, element);

      if (element) {
        if (typeof element === "string") {
          return renderStylesToString(element);
        } else {
          const output = renderStylesToNodeStream();
          return pump(element, output, err => {
            // `pump` doesn't forward the error from source to output stream
            // (perhaps) per Node's default behavior. It just silently destroys
            // the output stream to make sure no leak occurs.
            if (err)
              output.destroy(err);
          });
        }
      }

      return element;
    }
  };
};
