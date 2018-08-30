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
        gmctx.routerData = {initialProps: {}};
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
