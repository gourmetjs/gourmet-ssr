"use strict";

const React = require("react");
const GourmetContext = require("@gourmet/react-context-gmctx");
const omit = require("@gourmet/omit");
const parseHref = require("@gourmet/parse-href");
const cx = require("classnames");
const Router = require("./Router");

// to: string or Component
// params: object
// search: string ("?a=1&b=2")
// hash: string ("#hash")
// activeClassName: string
// autoPreload: true, false, "hover" (default is "hover")
module.exports = class Link extends React.Component {
  render() {
    return (
      <GourmetContext.Consumer>
        {gmctx => this._renderLink(gmctx)}
      </GourmetContext.Consumer>
    );
  }

  _renderLink(gmctx) {
    const router = Router.get();
    const activeRoute = gmctx.i80 && gmctx.i80.activeRoute;
    let {href, to, params, search, hash, autoPreload, className, children} = this.props;
    let isActive, route, omo;

    if (href) {
      const url = parseHref(href);
      route = router.searchByPath(gmctx, url);
      isActive = (url.path === (activeRoute && activeRoute.url.path));
    } else if (typeof to === "string" || typeof to === "function") {
      route = router.searchByComponent(gmctx, to, params, search, hash);
      if (route) {
        href = route.makeHref();
        const component = route.getComponent();
        isActive = activeRoute && activeRoute.getComponent() === component;
        const loadable = component.routeLoadable;
        if (!gmctx.isServer && typeof loadable === "function" && typeof loadable.preload === "function") {
          if (autoPreload === undefined || autoPreload === "hover")
            omo = () => loadable.preload();
          else if (autoPreload)
            loadable.preload();
        }
      } else {
        href = "/";
        isActive = false;
      }
    } else {
      throw Error("You must specify either `href` or 'to'");
    }

    className = this._getClassName(className, isActive);

    const props = omit(this.props, ["href", "to", "params", "search", "hash", "autoPreload", "className", "children"]);

    if (className)
      props.className = className;

    props.href = href;

    if (omo && !props.onMouseOver)
      props.onMouseOver = omo;

    if (typeof children === "function") {
      // Call a custom render function given as a child.
      // `props` has all props that are supposed to be handed over to '<a>'.
      return children.call(null, props, route, isActive);
    } else {
      return <a {...props}>{children}</a>;
    }
  }

  _getClassName(className, isActive) {
    const active = this.props.activeClassName === undefined ? "active" : this.props.activeClassName;
    if (active)
      return cx(className, {[active]: isActive});
    return className;
  }
};
