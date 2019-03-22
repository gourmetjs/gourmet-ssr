"use strict";

const React = require("react");
const ReactDOMServer = require("react-dom/server");
const GourmetContext = require("@gourmet/react-context-gmctx");
const registrar = require("@gourmet/loadable-registrar");
const promiseProtect = require("@gourmet/promise-protect");

// ** Server control flow **
// 1. Client (your code) calls `res.serve("page", {...clientProps}, {other_gmctx_attrs})`
//    `res.serve()` provides the following top-level properties for creating `gmctx`.
//    - clientProps
//    - reqArgs (url, method, headers, encrypted)
//    - {...other_gmctx_props}
//    ** Note that `res.serve()` is a helper for Connect(Express) + React.
// 2. Renderer calls `getInitialProps(gmctx)`.
//    - The returned object from `getInitialProps()` will be assigned to `gmctx.pageProps`.
// 3. Renderer calls `makePageProps(gmctx)`.
//    Default implementation returns an object with the following props.
//    - gmctx
//    - {...gmctx.clientProps}
//    - {...gmctx.pageProps}
// 4. Renderer calls `createPageElement(props)`.
// 5. Renderer copies `gmctx.clientProps` & `gmctx.pageProps` to `gmctx.data.*` to serialize
//    and pass them to the client for a rehydration.
module.exports = function getReactServerRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  // Options:
  //  - reactServerRender: "string", "static_markup", "stream", "static_stream"
  return class ReactServerRenderer extends Base {
    createContext(...args) {
      const gmctx = super.createContext(...args);

      const rendered = gmctx.data.renderedLoadables = [];

      gmctx.addRenderedLoadable = id => {
        if (rendered.indexOf(id) === -1)
          rendered.push(id);
      };

      gmctx.setHead = this.setHead.bind(this, gmctx);

      return gmctx;
    }

    prepareToRender(gmctx) {
      if (gmctx.clientProps)
        gmctx.data.clientProps = gmctx.clientProps;

      return Promise.all([
        super.prepareToRender(gmctx),
        registrar.loadAll(),
        this.fetchPageProps(gmctx)
      ]).then(([cont]) => {
        return cont;
      });
    }

    invokeUserRenderer(gmctx) {
      return promiseProtect(() => {
        const props = this.makePageProps(gmctx);
        const element = this.createPageElement(gmctx, this.userObject, props);
        return this.wrapWithContext(gmctx, element);
      });
    }

    fetchPageProps(gmctx) {
      const type = this.userObject;
      return Promise.all([
        type.getInitialProps && type.getInitialProps(gmctx),
        type.getStockProps && type.getStockProps(gmctx)
      ]).then(([initProps, stockProps]) => {
        if (initProps)
          gmctx.data.pageProps = initProps;
        if (initProps && stockProps)
          gmctx.pageProps = Object.assign({}, initProps, stockProps);
        else
          gmctx.pageProps = initProps || stockProps;
      });
    }

    // This must be synchronous.
    makePageProps(gmctx) {
      return Object.assign({gmctx}, gmctx.clientProps, gmctx.pageProps);
    }

    // This must be synchronous.
    createPageElement(gmctx, type, props) {
      return React.createElement(type, props);
    }

    renderToMedium(gmctx, element) {
      element = super.renderToMedium(gmctx, element);

      if (element) {
        let bodyMain;

        switch (this.getReactServerRenderOption(gmctx)) {
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

      return element;
    }

    getReactServerRenderOption() {
      return this.options.reactServerRender || "stream";
    }

    getBodyTail(gmctx) {
      let modules = [];

      gmctx.data.renderedLoadables.forEach(id => {
        const info = registrar.get(id);
        if (info.modules)
          modules = modules.concat(info.modules);
      });

      const deps = this.getStaticDeps(gmctx);
      const bundles = this.getBundles(gmctx, modules, deps);
      const staticPrefix = gmctx.manifest.client.staticPrefix;

      return [
        super.getBodyTail(gmctx)
      ].concat(bundles.map(filename => {
        return `<script defer src="${staticPrefix}${filename}"></script>`;
      })).join("\n");
    }

    setHead(gmctx, ...elements) {
      let head;

      if (elements[0] === "@top")
        head = gmctx.html.headTop;
      else if (elements[0] === "@main")
        head = gmctx.html.headMain;
      else if (elements[0] === "@bottom")
        head = gmctx.html.headBottom;

      if (head)
        elements.shift();
      else
        head = gmctx.html.headBottom;

      elements.forEach(element => {
        if (React.isValidElement(element)) {
          element = ReactDOMServer.renderToStaticMarkup(element);
        } else if (typeof element !== "string") {
          throw Error("gmctx.setHead() only accepts React elements or strings");
        }

        if (head.indexOf(element) === -1)
          head.push(element);
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
