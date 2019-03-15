"use strict";

const encodeUrl = require("encodeurl");
const escapeHtml = require("escape-html");
const Router = require("./Router");

module.exports = function(Base) {
  if (!Base)
    throw Error("`@gourmet/react-i80` cannot be the first one in the renderer chain. Check your configuration.");

  return class I80ServerRenderer extends Base {
    createContext(...args) {
      const gmctx = super.createContext(...args);
      const router = Router.get(true);
      if (router) {
        gmctx.i80 = {};
        gmctx.redirect = function(location, statusCode=302, content) {
          location = encodeUrl(location);
          content = content || `<p>[${statusCode}] Redirecting to ${escapeHtml(location)}...</p>`;
          gmctx.result = {
            statusCode,
            headers: {location},
            content
          };
          return true;
        };
      }
      return gmctx;
    }

    // This function is responsible for calling `getInitialProps()` of both route and page components.
    // They are called in parallel so you should not depend on the order of invocation.
    // However, it is guaranteed that `gmctx.i80.activeRoute` is available to both of `getInitialProps()`.
    prepareToRender(gmctx) {
      const router = Router.get(true);
      if (router) {
        if (router.resetActiveRoute(gmctx) === false)
          return false;
        return Promise.all([
          super.prepareToRender(gmctx),
          this.fetchRouteProps(gmctx)
        ]).then(([cont]) => {
          return cont;
        });
      } else {
        return super.prepareToRender(gmctx);
      }
    }

    fetchRouteProps(gmctx) {
      const route = gmctx.i80.activeRoute;
      const type = route.getComponent();
      return Promise.all([
        type.getInitialProps && type.getInitialProps(gmctx),
        type.getStockProps && type.getStockProps(gmctx)
      ]).then(([initProps, stockProps]) => {
        if (initProps)
          gmctx.data.routeProps = initProps;
        if (initProps && stockProps)
          gmctx.routeProps = Object.assign({}, initProps, stockProps);
        else
          gmctx.routeProps = initProps || stockProps;
      });
    }

    makeRouteProps(gmctx, directProps) {
      const route = gmctx.i80.activeRoute;
      const url = route.url;
      return Object.assign(
        {gmctx, route, path: url.path, params: route.params, search: url.search},
        gmctx.clientProps,
        gmctx.pageProps,
        gmctx.routeProps,
        directProps
      );
    }
  };
};
