"use strict";

const React = require("react");
const ReactDOM = require("react-dom");
const GourmetContext = require("@gourmet/react-context-gmctx");
const registrar = require("@gourmet/loadable-registrar");
const promiseProtect = require("@gourmet/promise-protect");

// ** Client control flow **
// 1. Browser loads `init.{page}.client.js`.
// 2. The init function calls `renderer.render()`.
// 3. Renderer calls `makePageProps(gmctx)`. 
//    Default implementation returns an object with following props.
//    - gmctx
//    - {...gmctx.data.clientProps}
//    - {...gmctx.data.pageProps}
// 3. Renderer calls `createPageElement(gmctx, type, props)`.
module.exports = function getReactClientRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  return class ReactClientRenderer extends Base {
    createContext(...args) {
      const gmctx = super.createContext(...args);
      gmctx.setHead = this.setHead.bind(this, gmctx);
      return gmctx;
    }

    prepareToRender(gmctx) {
      return Promise.all([
        super.prepareToRender(gmctx),
        this.userObject.getCodeProps && this.userObject.getCodeProps(gmctx)
      ]).then(([cont, codeProps]) => {
        if (codeProps)
          gmctx.codeProps = codeProps;
        return cont;
      });
    }

    invokeUserRenderer(gmctx) {
      return promiseProtect(() => {
        const props = this.makePageProps(gmctx);
        return this.createPageElement(gmctx, this.userObject, props);
      }).then(element => {
        if (element)
          return this.wrapWithContext(gmctx, element);
        return element;
      });
    }

    // This must be synchronous.
    makePageProps(gmctx) {
      return Object.assign({gmctx}, gmctx.data.clientProps, gmctx.data.pageProps, gmctx.codeProps);
    }

    // This can be asynchronous
    createPageElement(gmctx, type, props) {
      return React.createElement(type, props);
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

    wrapWithContext(gmctx, element) {
      return (
        <GourmetContext.Provider value={gmctx}>
          <div {...this.makeRootProps(gmctx)}>
            {element}
          </div>
        </GourmetContext.Provider>
      );
    }

    makeRootProps(gmctx) {  // eslint-disable-line
      return {id: "__gourmet_react__"};
    }
  };
};
