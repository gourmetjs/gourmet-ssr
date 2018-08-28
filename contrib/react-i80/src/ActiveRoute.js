"use strict";

const React = require("react");
const ReactContext = require("@gourmet/react-context-gmctx");
const Router = require("./Router");

module.exports = class ActiveRoute extends React.Component {
  render() {
    return (
      <ReactContext.Consumer>
        {gmctx => Router.get().renderActiveRoute(gmctx, this.props)}
      </ReactContext.Consumer>
    );
  }
};
