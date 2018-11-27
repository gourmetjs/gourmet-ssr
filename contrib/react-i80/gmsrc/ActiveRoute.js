"use strict";

const React = require("react");
const GourmetContext = require("@gourmet/react-context-gmctx");
const Router = require("./Router");

module.exports = class ActiveRoute extends React.Component {
  render() {
    return (
      <GourmetContext.Consumer>
        {gmctx => Router.get().renderActiveRoute(gmctx, this.props)}
      </GourmetContext.Consumer>
    );
  }
};
