"use strict";

const Router = require("./Router");
const ActiveRoute = require("./ActiveRoute");
const Link = require("./Link");

// - basePath: Default is `"/"`.
// - caseSensitive: Default is `true`.
// - strictSlash: Default is `false`.
function i80(routes, options={}) {
  const router = Router.create(routes, options, {   // eslint-disable-line no-unused-vars
    getTargetHref(gmctx) {
      return gmctx.url;
    },

    getInitialProps(route) {
      return route.getInitialProps().then(props => {
        if (props)
          route.gmctx.data.routerInitialProps = Object.assign({}, props);   // serialize data for client
        return props;
      });
    }
  });
}

i80.ActiveRoute = ActiveRoute;
i80.Link = Link;

module.exports = i80;
