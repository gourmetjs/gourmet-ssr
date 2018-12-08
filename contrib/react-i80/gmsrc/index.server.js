"use strict";

const promiseProtect = require("@gourmet/promise-protect");
const Router = require("./Router");
const ActiveRoute = require("./ActiveRoute");
const Link = require("./Link");

class ServerRouter extends Router {
  getTargetHref(gmctx) {
    return gmctx.reqArgs.url;
  }

  fetchRouteProps(route) {
    const gmctx = route.gmctx;
    return promiseProtect(() => {
      const func = route.getComponent().getInitialProps;
      if (typeof func === "function")
        return func(gmctx);
    }).then(props => {
      if (props)
        gmctx.routeProps = gmctx.data.routeProps = props;
    });
  }
}

// - basePath: Default is `"/"`.
// - caseSensitive: Default is `true`.
// - strictSlash: Default is `false`.
function i80(routes, options) {
  return ServerRouter.create(routes, options);
}

i80.ActiveRoute = ActiveRoute;
i80.Link = Link;
i80.getUrl = (...args) => Router.get().getUrl(...args);

module.exports = i80;
