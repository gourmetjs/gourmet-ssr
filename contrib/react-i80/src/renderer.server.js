"use strict";

const Router = require("./Router");

module.exports = function(Base) {
  if (!Base)
    throw Error("`@gourmet/react-i80` cannot be the first one in the renderer chain. Check your configuration.");

  return class I80ServerRenderer extends Base {
    createContext() {
      const gmctx = super.createContext();
      gmctx.routerData = {initialProps: {}};
      return gmctx;
    }

    invokeUserRenderer(gmctx) {
      const router = Router.get();
      const url = router.getRequestUrl(gmctx);
      return router.setActiveRoute(gmctx, url).then(route => {
        if (route.command) {
          if (route.command === "redirect")
            router.redirect(gmctx, route);
          return null;
        } else {
          return super.invokeUserRenderer(gmctx);
        }
      });
    }
  };
};
