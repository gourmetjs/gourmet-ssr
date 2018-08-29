"use strict";

const React = require("react");
const Router = require("./Router");
const BoundRoute = require("./BoundRoute");

module.exports = class Link extends React.Component {
  render() {
    const router = Router.get();
    const matcher = router.matcher;
    const props = this.props;
    let href;

    if (typeof props.to === "string") {
      // path only?
      const route = matcher.searchByPath(props.to, (type, params) => {
        return new BoundRoute(type, params);
      });
      href = props.to;
    }
    else if (typeof props.to === "function")
      href = Router.get().makeUrl(props.to, props.params, props.query, props.hash);

    return (
      <a href={href} className={className}>
        {this.props.children || label}
      </a>
    );
  }
};
