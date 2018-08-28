"use strict";

const encodeUrl = require("encodeurl");
const escapeHtml = require("escape-html");
const Router = require("./Router");
const ActiveRoute = require("./ActiveRoute");
const Link = require("./Link");

// - basePath: Default is `"/"`.
// - caseSensitive: Default is `true`.
// - strictSlash: Default is `false`.
function i80(routes, options={}) {
  const router = Router.create(routes, options, {   // eslint-disable-line no-unused-vars
    redirect(gmctx, info) {
      const statusCode = info.statusCode || 302;
      const location = encodeUrl(info.location);
      const content = info.content || `<p>[${statusCode}] Redirecting to ${escapeHtml(location)}...</p>`;
      gmctx.override({
        statusCode,
        headers: {location},
        content
      });
    },
    getRequestUrl(gmctx) {
      return {
        path: gmctx.path,
        query: gmctx.query
      };
    },
    getInitialProps(gmctx, route) {
      return route.getInitialProps(gmctx).then(props => {
        if (props)
          gmctx.data.routerInitialProps = Object.assign({}, props);   // serialize data for client
        return props;
      });
    }
  });
}

i80.ActiveRoute = ActiveRoute;
i80.Link = Link;

module.exports = i80;
