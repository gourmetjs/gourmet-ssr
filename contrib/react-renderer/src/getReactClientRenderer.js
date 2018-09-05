"use strict";

const ReactDOM = require("react-dom");
const registrar = require("@gourmet/loadable-registrar");
const wrapWithContext = require("./wrapWithContext");

// ** Client control flow **
// 1. Browser calls `renderer.render()`.
// 2. Renderer calls `makeProps(gmctx)`. 
//    Default implementation returns an object with following props.
//    - gmctx
//    - {...gmctx.data.initialProps}
// 3. Renderer calls `renderPage(props)`.
module.exports = function getReactClientRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  return class ReactClientRenderer extends Base {
    invokeUserRenderer(gmctx) {
      return super.invokeUserRenderer(gmctx).then(element => {
        if (element)
          return wrapWithContext(gmctx, element);
        return element;
      });
    }

    renderToDom(gmctx, content, elemId) {
      if (content) {
        return registrar.load(gmctx.data.renderedLoadables || []).then(() => {
          const parent = document.getElementById(elemId);
          if (gmctx.data.reactClientRender === "hydrate")
            ReactDOM.hydrate(content, parent);
          else
            ReactDOM.render(content, parent);
        });
      }
    }
  };
};
