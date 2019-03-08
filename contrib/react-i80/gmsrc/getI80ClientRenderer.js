"use strict";

const Router = require("./Router");

module.exports = function(Base) {
  if (!Base)
    throw Error("`@gourmet/react-i80` cannot be the first one in the renderer chain. Check your configuration.");

  return class I80ClientRenderer extends Base {
    constructor(...args) {
      super(...args);
      const router = Router.get(true);
      if (router)
        router.setRenderer(this);
      this.handleClick = this.handleClick.bind(this);
    }

    createContext(...args) {
      const gmctx = super.createContext(...args);
      const router = Router.get(true);
      if (router) {
        if (!gmctx.i80) // `i80` exists when switching a route on client
          gmctx.i80 = {};
        gmctx.redirect = function(location) {
          Router.get().goToUrl(location);
          return true;
        };
      }
      return gmctx;
    }

    // This is the same as the server version. See the comment of it.
    // The method is redefined here because we simply don't have a mechanism to share it.
    prepareToRender(gmctx) {
      const router = Router.get(true);
      if (router) {
        if (router.resetActiveRoute(gmctx) === false)
          return false;
        return Promise.all([
          super.prepareToRender(gmctx),
          this.getRouteProps(gmctx)
        ]).then(([cont, routeProps]) => {
          if (routeProps)
            gmctx.routeProps = routeProps;
          return cont;
        });
      } else {
        return super.prepareToRender(gmctx);
      }
    }

    getRouteProps(gmctx) {
      const route = gmctx.i80.activeRoute;
      // `getInitialProps()` of a route component gets called only when switching routes on the client.
      // Initial route's props are re-hydrated from server provided object.
      if (gmctx.i80.switchToHref) {
        const func = route.getComponent().getInitialProps;
        if (func)
          return func(gmctx);
      } else {
        return gmctx.data.routeProps;
      }
    }

    makeRouteProps(gmctx, directProps) {
      const route = gmctx.i80.activeRoute;
      const url = route.url;
      return Object.assign(
        {gmctx, route, path: url.path, params: route.params, search: url.search},
        gmctx.data.clientProps,
        gmctx.data.pageProps,
        gmctx.codeProps,
        gmctx.routeProps,
        directProps
      );
    }

    handleClick(e) {
      if (e.defaultPrevented ||
          e.metaKey || e.altKey || e.ctrlKey || e.shiftKey ||
          e.button !== 0)
        return;

      let elem = e.target;

      // Since a click could originate from a descendant of the `<a>` tag,
      // search through the tree upward to find the closest `<a>` tag.
      while (elem && elem.nodeName !== "A") {
        elem = elem.parentNode;
      }

      if (!elem ||
          (elem.target && elem.target !== "_self") ||
          elem.download)
        return;

      const href = elem.getAttribute("href");

      if (href) {
        const replace = elem.getAttribute("data-replace");
        Router.get().goToUrl(href, replace ? "replace" : true);
      }

      e.preventDefault();
    }

    makeRootProps(gmctx) {
      const props = super.makeRootProps(gmctx);
      const router = Router.get(true);
      if (router) {
        const options = router.options;
        if (options.captureClick === undefined || options.captureClick)
          props.onClick = this.handleClick;
      }
      return props;
    }
  };
};
