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
      const url = {
        path: gmctx.path,
        query: gmctx.query
      };
      return Router.get().setActiveRoute(gmctx, url).then(route => {
        if (route)
          return super.invokeUserRenderer(gmctx);
      });
    }
  };
};
