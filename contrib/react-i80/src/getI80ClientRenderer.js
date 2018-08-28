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
        initialProps: {}
      };
      return gmctx;
    }

    invokeUserRenderer(gmctx) {
      const router = Router.get();
      const url = gmctx.routerData.switchToUrl || router.getBrowserUrl();

      // We intentionally ignore "not found" or "redirect" for initial rendering
      // on client. In case of switching URL, these are handled by `goToUrl()`
      // before re-render the whole tree to prevent broken state while switching.
      return router.setActiveRoute(gmctx, url).then(() => {
        return super.invokeUserRenderer(gmctx);
      });
    }
  };
};
