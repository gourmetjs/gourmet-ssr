"use strict";

const ReactDOMServer = require("react-dom/server");
const registrar = require("@gourmet/loadable-registrar");
const wrapWithContext = require("./wrapWithContext");

module.exports = function getReactServerRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  // Options:
  //  - reactServerRender: "string", "static_markup", "stream", "static_stream"
  return class ReactServerRenderer extends Base {
    invokeUserRenderer(gmctx) {
      return registrar.loadAll().then(() => {
        return super.invokeUserRenderer(gmctx).then(element => {
          if (element)
            return wrapWithContext(gmctx, element);
          return element;
        });
      });
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
