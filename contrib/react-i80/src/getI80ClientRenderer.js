"use strict";

const Router = require("./Router");

module.exports = function(Base) {
  if (!Base)
    throw Error("`@gourmet/react-i80` cannot be the first one in the renderer chain. Check your configuration.");

  return class I80ClientRenderer extends Base {
    constructor(...args) {
      super(...args);
      const router = Router.get(true);
      if (router)
        router.setRenderer(this);
    }

    createContext(...args) {
      const gmctx = super.createContext(...args);
      const router = Router.get(true);
      if (router) {
        if (!gmctx.i80) // `i80` exists when switching a route on client
          gmctx.i80 = {};
        gmctx.redirect = function(location) {
          Router.get().goToUrl(location);
          return true;
        };
      }
      return gmctx;
    }

    invokeUserRenderer(gmctx) {
      const router = Router.get(true);
      if (router) {
        const href = router.getTargetHref(gmctx);
        return router.setActiveRoute(gmctx, href).then(cont => {
          if (cont)
            return super.invokeUserRenderer(gmctx);
        });
      } else {
        return super.invokeUserRenderer(gmctx);
      }
    }

    makeRouteProps(gmctx, directProps) {
      const route = gmctx.i80.activeRoute;
      const url = route.url;
      return Object.assign(
        {gmctx, activeRoute: route, path: url.path, search: url.search, hash: url.hash},
        gmctx.data.clientProps,
        gmctx.data.pageProps,
        gmctx.routeProps,
        directProps
      );
    }
  };
};
