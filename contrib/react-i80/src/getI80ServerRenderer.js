"use strict";

const Router = require("./Router");

module.exports = function(Base) {
  if (!Base)
    throw Error("`@gourmet/react-i80` cannot be the first one in the renderer chain. Check your configuration.");

  return class I80ServerRenderer extends Base {
    createContext(...args) {
      const gmctx = super.createContext(...args);
      gmctx.routerData = {initialProps: {}};
      return gmctx;
    }

    invokeUserRenderer(gmctx) {
      const router = Router.get();
      const url = router.getRequestUrl(gmctx);
      const route = router.findRoute(gmctx, url);

      if (!route)
        return null;

      if (route.command === "redirect")
        return router.redirect(gmctx, route);

      return router.setActiveRoute(gmctx, route, url).then(() => {
        return super.invokeUserRenderer(gmctx);
      });
    }
  };
};
