"use strict";

const React = require("react");
const ReactDOMServer = require("react-dom/server");
const registrar = require("@gourmet/loadable-registrar");
const promiseProtect = require("@gourmet/promise-protect");
const wrapWithContext = require("./wrapWithContext");

// ** Server control flow **
// 1. HTTP server (your code) calls `gourmet.render("page", {...initialProps}, {other_gmctx_props})`
//    `gourmet.render()` provides the following top-level properties for creating `gmctx`.
//    Note that `gourmet.render()` is a helper for Connect(Express) + React.
//    - initialProps
//    - reqArgs (url, method, headers, encrypted)
//    - {...other_gmctx_props}
// 2. Renderer calls `getInitialProps(gmctx)`.
//    - Initially, `gmctx.initialProps` contains passed-in initial props of step #1.
//    - The returned object from `getInitialProps()` will be merged with
//      `gmctx.initialProps` to construct the final initial props.
//    - In rare case where you want to replace, not to merge the initial props,
//      empty `gmctx.initialProps` before you return an object.
// 3. Renderer copies `gmctx.initialProps` to `gmctx.data.initialProps` to serialize
//    and pass it to the client for a rehydration.
// 4. Renderer calls `makeProps(gmctx)`.
//    Default implementation returns an object with the following props.
//    - gmctx
//    - {...gmctx.initialProps}
// 5. Renderer calls `renderPage(props)`.
module.exports = function getReactServerRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  // Options:
  //  - reactServerRender: "string", "static_markup", "stream", "static_stream"
  return class ReactServerRenderer extends Base {
    invokeUserRenderer(gmctx) {
      return Promise.all([
        registrar.loadAll(),
        this.getPageProps(gmctx, this.userObject)
      ]).then(([, props]) => {
        return this.renderPage(props);
      }).then(element => {
        if (element)
          return wrapWithContext(gmctx, element);
        return element;
      });
    }

    getPageProps(gmctx, component) {
      return promiseProtect(() => {
        if (component.getInitialProps)
          return component.getInitialProps(gmctx);
      }).then(initialProps => {
        if (initialProps)
          Object.assign(gmctx.initialProps, initialProps);

        if (Object.keys(gmctx.initialProps).length)
          gmctx.data.initialProps = gmctx.initialProps;

        if (component.makeProps)
          return component.makeProps(gmctx);
        else
          return this.makeProps(gmctx);
      });
    }

    // This is a synchronous
    makeProps(gmctx) {
      return Object.assign({gmctx}, gmctx.initialProps);
    }

    // This can return a promise
    renderPage(props) {
      const component = this.userObject;

      if (component.renderPage)
        return component.renderPage(props);

      return React.createElement(component, props);
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

      if (!gmctx.initialProps)
        gmctx.initialProps = {};

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
