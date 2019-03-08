"use strict";

const parseHref = require("@gourmet/parse-href");
const Router = require("./Router");
const ActiveRoute = require("./ActiveRoute");
const Link = require("./Link");

class ClientRouter extends Router {
  setRenderer(renderer) {
    this.renderer = renderer;

    window.addEventListener("popstate", () => {
      this.goToUrl(window.location.href, false);
    });
  }

  getTargetHref(gmctx) {
    if (gmctx.i80.switchToHref)
      return gmctx.i80.switchToHref;
    return window.location.href;
  }

  // - Relative path is not supported.
  // - `history`: true, false, or "replace"
  goToUrl(href, history=true) {
    function _load(href) {
      window.location = href; // initiate a new page request
    }

    const renderer = this.renderer;

    if (renderer) {
      const loc = window.location;
      const url = parseHref(href);
      let origin = url.origin;

      if (origin && origin.startsWith("//"))
        origin = loc.protocol + origin;

      if (!origin || origin === loc.origin) {
        renderer.render({
          i80: {
            switchToHref: href,
            didSwitchToHref() {
              if (history === true)
                window.history.pushState({}, "", href);
              else if (history === "replace")
                window.history.replaceState({}, "", href);
            },
            routeNotFound() {
              _load(href);
            }
          }
        });
      } else {
        _load(href);
      }
    } else {
      console.error(`[@gourmet/react-i80] Renderer is not initialized, loading the URL instead: ${href}`);
      _load(href);
    }
  }

}

// - basePath: Default is `"/"`.
// - caseSensitive: Default is `true`.
// - strictSlash: Default is `false`.
// - captureClick: Default is `true`.
function i80(routes, options) {
  return ClientRouter.create(routes, options);
}

i80.ActiveRoute = ActiveRoute;
i80.Link = Link;
i80.getUrl = (...args) => Router.get().getUrl(...args);
i80.goToUrl = (...args) => Router.get().goToUrl(...args);

module.exports = i80;
