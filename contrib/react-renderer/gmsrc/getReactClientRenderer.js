"use strict";

const React = require("react");
const ReactDOM = require("react-dom");
const registrar = require("@gourmet/loadable-registrar");
const promiseProtect = require("@gourmet/promise-protect");
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
    createContext(...args) {
      const gmctx = super.createContext(...args);

      gmctx.setHead = this.setHead.bind(this, gmctx);

      return gmctx;
    }

    invokeUserRenderer(gmctx) {
      const page = this.userObject;

      return promiseProtect(() => {
        const props = page.makePageProps ? page.makePageProps(gmctx) : this.makePageProps(gmctx);

        if (page.renderPage)
          return page.renderPage(props);
        else
          return React.createElement(page, props);
      }).then(element => {
        if (element)
          return wrapWithContext(this, gmctx, element);
        return element;
      });
    }

    makeRootProps(gmctx) {  // eslint-disable-line
      return {id: "__gourmet_react__"};
    }

    // This must be synchronous.
    makePageProps(gmctx) {
      return Object.assign({gmctx}, gmctx.data.clientProps, gmctx.data.pageProps);
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

    setHead(gmctx, ...elements) {
      if (elements[0] === "@top" || elements[0] === "@main" || elements[0] === "@bottom")
        elements.shift();

      elements.forEach(element => {
        if (React.isValidElement(element)) {
          if (element.type === "title") {
            const title = element.props.children;
            if (title && typeof title !== "string")
              throw Error("Children of '<title>' must be a string");
            document.title = title;
          }
        } else if (typeof element !== "string") {
          throw Error("gmctx.setHead() only accepts React elements or strings");
        }
      });
    }
  };
};
