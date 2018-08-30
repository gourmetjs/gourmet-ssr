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

    createContext(args) {
      const gmctx = super.createContext(args);
      const router = Router.get(true);
      if (router) {
        gmctx.routerData = {
          switchToHref: args && args.switchToHref,
          didSwitchToHref: args && args.didSwitchToHref,
          routeNotFound: args && args.routeNotFound,
          initialProps: {}
        };
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
  };
};
