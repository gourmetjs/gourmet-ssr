"use strict";



// - Route handler features
//   - Can return a promise for async job
//   - Can skip the current route and go to the next route
//   - Can redirect to URL (302 on server, `go` on browser)

const Router = require("./Router");

module.exports = function(gmctx) {
  const router = Router.get();
  const info = router.getCurrentUrl(gmctx);
  return router.findRoute(gmctx, info).then(route => {
    if (!route)
      return null;
    if (typeof route.component.getInitialProps === "function") {
      return 
    }
  });




  return router.runRouteHandlers(gmctx, route).then(res => {
    if (res === null)
      return null;

    if (res.redirect)
      router.redirect(res.redirect);


  });

  gmctx.route = route;
  gmctx._routerTest = "server";
  });
};
