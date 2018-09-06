"use strict";

const React = require("react");
const ReactDOMServer = require("react-dom/server");
const registrar = require("@gourmet/loadable-registrar");
const promiseProtect = require("@gourmet/promise-protect");
const wrapWithContext = require("./wrapWithContext");

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
// 4. Renderer calls `renderPage(props)`.
// 5. Renderer copies `gmctx.clientProps` & `gmctx.pageProps` to `gmctx.data.*` to serialize
//    and pass them to the client for a rehydration.
module.exports = function getReactServerRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  // Options:
  //  - reactServerRender: "string", "static_markup", "stream", "static_stream"
  return class ReactServerRenderer extends Base {
    invokeUserRenderer(gmctx) {
      const page = this.userObject;

      return Promise.all([
        registrar.loadAll(),
        promiseProtect(() => {
          if (page.getInitialProps)
            return page.getInitialProps(gmctx);
        })
      ]).then(([, pageProps]) => {
        if (pageProps)
          gmctx.pageProps = pageProps;

        const props = page.makePageProps ? page.makePageProps(gmctx) : this.makePageProps(gmctx);

        if (page.renderPage)
          return page.renderPage(props);
        else
          return React.createElement(page, props);
      }).then(element => {
        if (element) {
          if (gmctx.clientProps)
            gmctx.data.clientProps = gmctx.clientProps;

          if (gmctx.pageProps)
            gmctx.data.pageProps = gmctx.pageProps;

          return wrapWithContext(gmctx, element);
        }
        return element;
      });
    }

    // This is a synchronous
    makePageProps(gmctx) {
      return Object.assign({gmctx}, gmctx.clientProps, gmctx.pageProps);
    }

    renderToMedium(gmctx, element) {
      element = super.renderToMedium(gmctx, element);

      if (element) {
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

      return element;
    }

    createContext(...args) {
      const gmctx = super.createContext(...args);

      const rendered = gmctx.data.renderedLoadables = [];

      gmctx.addRenderedLoadable = id => {
        if (rendered.indexOf(id) === -1)
          rendered.push(id);
      };

      return gmctx;
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
      const staticPrefix = gmctx.manifest.staticPrefix;

      return [
        super.getBodyTail(gmctx)
      ].concat(bundles.map(filename => {
        return `<script defer src="${staticPrefix}${filename}"></script>`;
      })).join("\n");
    }
  };
};
