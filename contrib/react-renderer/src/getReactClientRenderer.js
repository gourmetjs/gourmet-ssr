"use strict";

const ReactDOM = require("react-dom");
const registrar = require("@gourmet/loadable-registrar");
const wrapWithContext = require("./wrapWithContext");

module.exports = function getReactClientRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  return class ReactClientRenderer extends Base {
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
};
