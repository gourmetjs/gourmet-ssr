"use strict";

// - basePath: Default is `"/"`.
// - captureClick: Default is `true`.
function i80(routes, options={}) {
  const router = Router.create(routes, options, {
    redirect(gmctx, href) {
      goToUrl(href);
    },
    getCurrentUrl(/*gmctx*/) {
      const loc = window.location;
      return {
        path: loc.pathname,
        query: loc.search,
        hash: loc.hash
      };
    },
    prepareRoute(gmctx) {
    }
  });
}
