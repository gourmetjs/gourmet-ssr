"use strict";

const Router = require("./Router");

module.exports = function(Base) {
  if (!Base)
    throw Error("`@gourmet/react-i80` cannot be the first one in the renderer chain. Check your configuration.");

  return class I80ClientRenderer extends Base {
    constructor(...args) {
      super(...args);
      Router.get().setRenderer(this);
    }

    createContext(args) {
      const gmctx = super.createContext(args);
      gmctx.routerData = {
        switchToUrl: args && args.switchToUrl,
        didSwitchToUrl: args && args.didSwitchToUrl,
        routeNotFound: args && args.routeNotFound,
        initialProps: {}
      };
      gmctx.redirect = function(location) {
        Router.get().goToUrl(location);
        return true;
      };
      return gmctx;
    }

    invokeUserRenderer(gmctx) {
      const router = Router.get();
      const url = router.getTargetUrl(gmctx);
      return router.setActiveRoute(gmctx, url).then(cont => {
        if (cont)
          return super.invokeUserRenderer(gmctx);
      });
    }
  };
};
