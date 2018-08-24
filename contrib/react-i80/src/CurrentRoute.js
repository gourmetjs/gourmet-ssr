"use strict";

const React = require("react");
const ReactContext = require("@gourmet/react-context-gmctx");
const Router = require("./Router");

module.exports = class CurrentRoute extends React.Component {
  componentWillUnmount() {
    Router.get().clearCurrentRoute(this);
  }

  render() {
    return (
      <ReactContext.Consumer>
        {gmctx => Router.get().renderCurrentRoute(gmctx, this.props, () => this.forceUpdate())};
      </ReactContext.Consumer>
    );
  }
};
