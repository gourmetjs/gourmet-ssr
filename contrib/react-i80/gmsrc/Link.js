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
    let props = this.props;
    let href, isActive, route;
    let omo;

    if (typeof props.to === "string") {
      const url = parseHref(props.to);
      route = router.searchByPath(gmctx, url);
      href = props.to;
      isActive = (url.path === (activeRoute && activeRoute.url.path));
    } else if (typeof props.to === "function") {
      const component = props.to;
      route = router.searchByComponent(gmctx, component, props.params, props.search, props.hash);
      href = route ? route.makeHref() : "/";
      isActive = activeRoute && activeRoute.getComponent() === component;
      const loadable = component.routeLoadable;
      if (!gmctx.isServer && typeof loadable === "function" && typeof loadable.preload === "function") {
        if (props.autoPreload === undefined || props.autoPreload === "hover")
          omo = () => loadable.preload();
        else if (props.autoPreload)
          loadable.preload();
      }
    } else {
      throw Error("'to' must be a string or a route component");
    }

    const className = this._getClassName(props.className, isActive);

    props = omit(props, ["to", "params", "search", "hash", "className", "autoPreload"]);

    if (className)
      props.className = className;

    props.href = href;

    if (omo && !props.onMouseOver)
      props.onMouseOver = omo;

    if (typeof this.props.children === "function") {
      // Call a custom render function given as a child.
      // `props` has all props that are supposed to be handed over to '<a>'.
      return this.props.children.call(null, props, route, isActive);
    } else {
      return (
        <a {...props}>
          {this.props.children}
        </a>
      );
    }
  }

  _getClassName(className, isActive) {
    const active = this.props.activeClassName === undefined ? "active" : this.props.activeClassName;
    if (active)
      return cx(className, {[active]: isActive});
    return className;
  }
};
